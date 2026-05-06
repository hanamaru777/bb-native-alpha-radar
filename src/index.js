import { config, validateConfig } from "./config.js";
import {
  deferInteraction,
  editInteractionReply,
  getApplication,
  getGateway,
  postMessage,
  registerCommands,
  replyInteraction
} from "./discord.js";
import {
  analyzeTokenFlow,
  formatCriteria,
  formatFlowAnalysis,
  formatHelp,
  formatRadarButtons,
  formatRadarReport,
  formatStats,
  scanAlphaCandidates
} from "./radar.js";
import { applyNotificationPolicy, findAlertByCa, getStats, saveAlert } from "./store.js";

validateConfig();
let applicationId = "";

async function runRadarOnce() {
  const candidates = await scanAlphaCandidates();
  const notifyCandidates = applyNotificationPolicy(candidates);

  for (const candidate of notifyCandidates) {
    saveAlert(candidate, "auto");
  }

  if (notifyCandidates.length > 0) {
    await postMessage(
      config.discordToken,
      config.alertChannelId,
      formatRadarReport(notifyCandidates),
      formatRadarButtons(notifyCandidates)
    );
  }
}

async function handleRadar(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);

  try {
    const candidates = await scanAlphaCandidates();
    if (!candidates.length) {
      await editInteractionReply(
        config.discordToken,
        applicationId,
        interaction.token,
        "Nansenから現在の条件に合う候補を取得できませんでした。/criteria で抽出条件を確認できます。"
      );
      return;
    }

    for (const candidate of candidates) {
      saveAlert(candidate, "manual");
    }

    await editInteractionReply(
      config.discordToken,
      applicationId,
      interaction.token,
      formatRadarReport(candidates),
      formatRadarButtons(candidates)
    );
  } catch (error) {
    await editInteractionReply(
      config.discordToken,
      applicationId,
      interaction.token,
      `Nansen取得でエラーが出ました: ${error.message}`
    );
  }
}

async function handleFlow(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);

  const ca = interaction.data?.options?.find((option) => option.name === "ca")?.value;
  const known = ca ? findAlertByCa(ca) : null;
  const liveAnalysis = !known && ca
    ? await analyzeTokenFlow(ca).catch((error) => ({
        symbol: "ERROR",
        ca,
        marketCap: "取得失敗",
        smartMoneyInflows: "取得失敗",
        newWalletGrowth: "取得失敗",
        bbScore: "未採点",
        reason: "Nansen APIから分析を取得できませんでした。",
        caution: error.message
      }))
    : null;

  const fallback = {
    symbol: "UNKNOWN",
    ca: ca || "unknown",
    marketCap: "未取得",
    smartMoneyInflows: "未取得",
    newWalletGrowth: "未取得",
    bbScore: "未採点",
    reason: "まだ通知履歴にないCAです。Nansen APIで追加分析できない場合は履歴なしとして返します。",
    caution: "DexScreener、gmgn、Nansenで必ず確認してください。"
  };

  const analysis = known || liveAnalysis || fallback;

  await editInteractionReply(
    config.discordToken,
    applicationId,
    interaction.token,
    formatFlowAnalysis(analysis),
    formatRadarButtons([analysis])
  );
}

async function handleInteraction(payload) {
  if (payload.t !== "INTERACTION_CREATE") return;

  const interaction = payload.d;
  const commandName = interaction.data?.name;

  if (commandName === "radar") {
    await handleRadar(interaction);
    return;
  }

  if (commandName === "flow") {
    await handleFlow(interaction);
    return;
  }

  if (commandName === "criteria") {
    await replyInteraction(
      config.discordToken,
      interaction.id,
      interaction.token,
      formatCriteria()
    );
    return;
  }

  if (commandName === "help") {
    await replyInteraction(
      config.discordToken,
      interaction.id,
      interaction.token,
      formatHelp()
    );
    return;
  }

  if (commandName === "stats") {
    await replyInteraction(
      config.discordToken,
      interaction.id,
      interaction.token,
      formatStats(getStats())
    );
  }
}

async function connectGateway() {
  const gatewayUrl = await getGateway(config.discordToken);
  const ws = new WebSocket(`${gatewayUrl}/?v=10&encoding=json`);
  let heartbeatTimer = null;

  ws.addEventListener("message", async (event) => {
    const payload = JSON.parse(event.data);

    if (payload.op === 10) {
      heartbeatTimer = setInterval(() => {
        ws.send(JSON.stringify({ op: 1, d: null }));
      }, payload.d.heartbeat_interval);

      ws.send(JSON.stringify({
        op: 2,
        d: {
          token: config.discordToken,
          intents: 0,
          properties: {
            os: "windows",
            browser: "bb-native-alpha-radar",
            device: "bb-native-alpha-radar"
          }
        }
      }));
    }

    if (payload.op === 0) {
      await handleInteraction(payload).catch((error) => {
        console.error("interaction error:", error.message);
      });
    }
  });

  ws.addEventListener("close", () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    console.log("Gateway closed. Restart the bot if this was unexpected.");
  });
}

const app = await getApplication(config.discordToken);
applicationId = app.id;
await registerCommands(config.discordToken, app.id, config.guildId);

console.log(`Logged in application: ${app.name}`);
console.log(config.guildId ? "Slash commands registered to test server." : "Global slash commands registered.");
console.log(config.mockMode ? "MOCK_MODE is ON. Nansen data is simulated." : "MOCK_MODE is OFF.");
console.log(`Auto alert policy: max ${config.maxDailyAlerts}/day, dedupe ${config.dedupeHours}h, min score ${config.minBbScore}.`);

await connectGateway();

const intervalMs = Math.max(config.alertIntervalMinutes, 1) * 60 * 1000;
setInterval(() => {
  runRadarOnce().catch((error) => console.error("radar error:", error.message));
}, intervalMs);
