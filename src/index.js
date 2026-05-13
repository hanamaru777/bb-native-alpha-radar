import { config, validateConfig } from "./config.js";
import {
  deferInteraction,
  editInteractionReply,
  getApplication,
  getGateway,
  getRecentMessages,
  postMessage,
  registerCommands,
  replyInteraction
} from "./discord.js";
import {
  analyzeTokenFlow,
  formatConfigDaily as formatConfigSummary,
  formatCriteriaProduction as formatCriteria,
  formatDailyStatsContent,
  formatDailyStatsEmbed,
  formatFlowEmbedProduction as formatFlowEmbed,
  formatFlowIntroProduction as formatFlowCardIntro,
  formatHealthProduction as formatHealthSummary,
  formatHelpDaily as formatHelp,
  formatLeaderboardEmbeds,
  formatLeaderboardIntro,
  formatRadarButtons,
  formatRadarCreditErrorProduction as formatRadarCreditError,
  formatRadarEmbedsWinning as formatRadarEmbeds,
  formatRadarIntroWinning as formatRadarCardIntro,
  formatRadarMissReportWinning as formatRadarMissReport,
  formatRejectedRadarButtons,
  formatRejectionsEmbed,
  formatRejectionsIntro,
  formatReportDaily as formatReport,
  formatWhyEmbed,
  formatWhyIntro,
  scanAlphaCandidatesDetailed
} from "./radar.js";
import { writeMarkdownReport } from "./reportFile.js";
import {
  applyNotificationPolicy,
  attachDiscordMessageToAlerts,
  findAlertByCa,
  getStats,
  readDailySummaryState,
  saveAlert,
  saveScanSummary,
  updateAlertReactions,
  writeDailySummaryState
} from "./store.js";
import { updateTrackingOnce } from "./tracking.js";
import { getSolanaSmartMoneyNetflow } from "./nansen.js";
import { checkNansenCli } from "./nansenCli.js";
import { fetchRadarMessageReactions } from "./reactions.js";

validateConfig();
let applicationId = "";
let lastRadarStatus = null;

function messageSearchText(message) {
  const parts = [message.content || ""];
  for (const embed of message.embeds || []) {
    parts.push(embed.title || "", embed.description || "");
    for (const field of embed.fields || []) {
      parts.push(field.name || "", field.value || "");
    }
  }
  return parts.join("\n").toLowerCase();
}

async function applyBbUnpostedFilter(result) {
  try {
    const messages = await getRecentMessages(config.discordToken, config.alertChannelId, config.bbLookbackMessages);
    const checkedCount = messages.length;
    const haystack = messages.map(messageSearchText).join("\n");
    const candidates = [];
    const rejected = [...(result.rejected || [])];

    for (const candidate of result.candidates || []) {
      const ca = String(candidate.ca || "").toLowerCase();
      const symbol = String(candidate.symbol || "").toLowerCase();
      const symbolAlreadyPosted = symbol && symbol !== "unknown" && haystack.includes(`$${symbol}`);
      const caAlreadyPosted = ca && haystack.includes(ca);
      if (caAlreadyPosted || symbolAlreadyPosted) {
        rejected.unshift({
          ...candidate,
          bbScore: Math.min(Number(candidate.bbScore || 0), config.minBbScore - 1),
          metrics: {
            ...(candidate.metrics || {}),
            bbAlreadyPosted: true,
            bbLookbackChecked: checkedCount,
            bbPostedMatch: caAlreadyPosted ? "ca" : "symbol"
          }
        });
      } else {
        candidates.push({
          ...candidate,
          metrics: {
            ...(candidate.metrics || {}),
            bbAlreadyPosted: false,
            bbLookbackChecked: checkedCount
          }
        });
      }
    }

    return {
      ...result,
      candidates,
      rejected: rejected.slice(0, 5)
    };
  } catch (error) {
    console.error("bb unposted filter skipped:", error.message);
    return result;
  }
}

async function runRadarOnce() {
  const startedAt = new Date();
  console.log(`[auto radar] started at ${startedAt.toLocaleString()} (min score ${config.minBbScore}, limit ${config.radarDisplayLimit}).`);
  const result = await applyBbUnpostedFilter(await scanAlphaCandidatesDetailed());
  saveScanSummary(result, "auto");
  const candidates = result.candidates;
  const notifyCandidates = applyNotificationPolicy(candidates).slice(0, config.radarDisplayLimit);
  lastRadarStatus = {
    at: new Date().toISOString(),
    scannedCount: result.scannedCount,
    passedCount: result.candidates.length,
    rejectedCount: result.rejected.length,
    postedCount: notifyCandidates.length,
    sourceErrors: result.sourceErrors || []
  };

  console.log(
    `[auto radar] checked: scanned ${result.scannedCount ?? "n/a"}, passed ${result.candidates.length}, ` +
    `rejected ${result.rejected.length}, posted ${notifyCandidates.length}.`
  );
  if (result.sourceErrors?.length) {
    console.log(`[auto radar] partial Nansen source errors: ${result.sourceErrors.join(" | ")}`);
  }

  const savedAlerts = notifyCandidates.map((candidate) => saveAlert(candidate, "auto"));

  if (savedAlerts.length > 0) {
    const message = await postMessage(
      config.discordToken,
      config.alertChannelId,
      formatRadarCardIntro(savedAlerts),
      formatRadarButtons(savedAlerts),
      formatRadarEmbeds(savedAlerts)
    );
    attachDiscordMessageToAlerts(savedAlerts, message);
  } else {
    console.log("[auto radar] no Discord post. Reason: no candidate passed alert policy, daily cap, or dedupe.");
  }
}

async function runTrackingOnce() {
  const result = await updateTrackingOnce();
  if (result.checked > 0) {
    console.log(`Tracking checked ${result.checked}, updated ${result.updated}, failed ${result.failed}.`);
  }
}

function dailySummaryNowParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: config.dailySummaryTimezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  }).formatToParts(date);
  const get = (type) => parts.find((part) => part.type === type)?.value || "";
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    hour: Number(get("hour")),
    minute: Number(get("minute"))
  };
}

async function maybePostDailySummary() {
  if (!config.dailySummaryEnabled) return;
  const now = dailySummaryNowParts();
  if (now.hour !== config.dailySummaryHour || now.minute !== config.dailySummaryMinute) return;

  const state = readDailySummaryState();
  if (state.lastPostedDate === now.dateKey) return;

  const stats = await refreshDailyStatsReactions(getStats());
  const message = await postMessage(
    config.discordToken,
    config.alertChannelId,
    formatDailyStatsContent(stats),
    [],
    [formatDailyStatsEmbed(stats)]
  );

  writeDailySummaryState({
    lastPostedDate: now.dateKey,
    lastPostedAt: new Date().toISOString(),
    messageId: message?.id || null,
    channelId: message?.channel_id || config.alertChannelId
  });
  console.log(`[daily summary] posted for ${now.dateKey}.`);
}

async function handleRadar(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);

  try {
    const result = await applyBbUnpostedFilter(await scanAlphaCandidatesDetailed());
    lastRadarStatus = {
      at: new Date().toISOString(),
      scannedCount: result.scannedCount,
      passedCount: result.candidates.length,
      rejectedCount: result.rejected.length,
      postedCount: 0,
      sourceErrors: result.sourceErrors || []
    };
    saveScanSummary(result, "manual");
    const candidates = result.candidates;
    if (!candidates.length) {
      await editInteractionReply(
        config.discordToken,
        applicationId,
        interaction.token,
        formatRadarMissReport(result.rejected, result.scannedCount, getStats()),
        formatRejectedRadarButtons(result.rejected)
      );
      return;
    }

    const displayCandidates = candidates.slice(0, config.radarDisplayLimit);
    const savedAlerts = displayCandidates.map((candidate) => saveAlert(candidate, "manual"));
    lastRadarStatus.postedCount = savedAlerts.length;

    const message = await editInteractionReply(
      config.discordToken,
      applicationId,
      interaction.token,
      formatRadarCardIntro(savedAlerts),
      formatRadarButtons(savedAlerts),
      formatRadarEmbeds(savedAlerts)
    );
    attachDiscordMessageToAlerts(savedAlerts, message);
  } catch (error) {
    lastRadarStatus = {
      at: new Date().toISOString(),
      scannedCount: "error",
      passedCount: "error",
      rejectedCount: "error",
      postedCount: 0,
      sourceErrors: [error.message]
    };
    console.error("[manual radar] error:", error.message);
    await editInteractionReply(
      config.discordToken,
      applicationId,
      interaction.token,
      formatRadarCreditError(error)
    );
    return;
    await editInteractionReply(
      config.discordToken,
      applicationId,
      interaction.token,
      `Nansen取得でエラーが出ました: ${error.message}`
    );
  }
}

async function handleHealth(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);

  let nansenOk = false;
  let nansenMessage = "";
  try {
    await getSolanaSmartMoneyNetflow(1);
    nansenOk = true;
  } catch (error) {
    nansenMessage = error.message.slice(0, 120);
  }
  const nansenCli = await checkNansenCli();

  await editInteractionReply(
    config.discordToken,
    applicationId,
    interaction.token,
    formatHealthSummary({
      botOk: true,
      nansenOk,
      nansenMessage,
      nansenCliOk: nansenCli.ok,
      nansenCliCommand: nansenCli.command,
      nansenCliMessage: nansenCli.message,
      lastRadarAt: lastRadarStatus?.at || null,
      lastScannedCount: lastRadarStatus?.scannedCount,
      lastPassedCount: lastRadarStatus?.passedCount,
      lastRejectedCount: lastRadarStatus?.rejectedCount,
      lastPostedCount: lastRadarStatus?.postedCount,
      lastRadarErrors: lastRadarStatus?.sourceErrors
    })
  );
}

async function handleFlow(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);

  const ca = interaction.data?.options?.find((option) => option.name === "ca")?.value;
  const known = ca ? findAlertByCa(ca) : null;
  const liveAnalysis = ca
    ? await analyzeTokenFlow(ca).catch((error) => ({
        symbol: known?.symbol || "UNKNOWN",
        ca,
        marketCap: known?.marketCap || "Nansen unavailable",
        smartMoneyInflows: known?.smartMoneyInflows || "n/a",
        newWalletGrowth: "n/a",
        bbScore: known?.bbScore || "not scored",
        reason: "Nansen live analysis is temporarily unavailable.",
        caution: `Nansen fetch failed: ${error.message}`
      }))
    : null;

  const fallback = {
    symbol: "UNKNOWN",
    ca: ca || "unknown",
    marketCap: "not available",
    smartMoneyInflows: "not available",
    newWalletGrowth: "not available",
    bbScore: "not scored",
    reason: "This CA is not in the saved alert history yet.",
    caution: "Verify with DexScreener, gmgn, and Nansen."
  };

  const analysis = known
    ? {
        ...known,
        nansenDeepDive: liveAnalysis?.nansenDeepDive,
        liveNansenReason: liveAnalysis?.reason,
        liveNansenCaution: liveAnalysis?.caution
      }
    : liveAnalysis || fallback;

  await editInteractionReply(
    config.discordToken,
    applicationId,
    interaction.token,
    formatFlowCardIntro(analysis),
    formatRadarButtons([analysis]),
    [formatFlowEmbed(analysis)]
  );
}

async function refreshLeaderboardReactions(stats) {
  const targets = stats.tracking?.leaderboard || [];
  for (const alert of targets.slice(0, 5)) {
    try {
      const reactions = await fetchRadarMessageReactions(alert);
      if (reactions) updateAlertReactions(alert.radarCall?.id, reactions);
    } catch (error) {
      console.error(`reaction fetch skipped ${alert.symbol || alert.ca}:`, error.message);
    }
  }
  return getStats();
}

async function refreshDailyStatsReactions(stats) {
  const pool = [...(stats.recent || []), ...(stats.tracking?.leaderboard || [])];
  const seen = new Set();
  for (const alert of pool) {
    const radarCallId = Number(alert?.radarCall?.id);
    if (!Number.isFinite(radarCallId) || seen.has(radarCallId)) continue;
    seen.add(radarCallId);
    try {
      const reactions = await fetchRadarMessageReactions(alert);
      if (reactions) updateAlertReactions(radarCallId, reactions);
    } catch (error) {
      console.error(`daily reaction fetch skipped ${alert.symbol || alert.ca}:`, error.message);
    }
  }
  return getStats();
}

async function handleWhy(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);
  const ca = interaction.data?.options?.find((option) => option.name === "ca")?.value;
  const known = ca ? findAlertByCa(ca) : null;
  if (!known) {
    await editInteractionReply(
      config.discordToken,
      applicationId,
      interaction.token,
      `保存済みのRadar Callが見つからなかったよ。\n先に \`/radar\` で候補を保存するか、CAを確認してね。`
    );
    return;
  }

  await editInteractionReply(
    config.discordToken,
    applicationId,
    interaction.token,
    formatWhyIntro(known),
    formatRadarButtons([known]),
    [formatWhyEmbed(known)]
  );
}

async function handleLeaderboard(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);
  const stats = await refreshLeaderboardReactions(getStats());
  await editInteractionReply(
    config.discordToken,
    applicationId,
    interaction.token,
    formatLeaderboardIntro(stats),
    [],
    formatLeaderboardEmbeds(stats)
  );
}

async function handleRejections(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);
  const stats = getStats();
  await editInteractionReply(
    config.discordToken,
    applicationId,
    interaction.token,
    formatRejectionsIntro(stats),
    [],
    [formatRejectionsEmbed(stats)]
  );
}

async function handleStats(interaction) {
  await deferInteraction(config.discordToken, interaction.id, interaction.token);
  const stats = await refreshDailyStatsReactions(getStats());
  await editInteractionReply(
    config.discordToken,
    applicationId,
    interaction.token,
    formatDailyStatsContent(stats),
    [],
    [formatDailyStatsEmbed(stats)]
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

  if (commandName === "why") {
    await handleWhy(interaction);
    return;
  }

  if (commandName === "leaderboard") {
    await handleLeaderboard(interaction);
    return;
  }

  if (commandName === "rejections") {
    await handleRejections(interaction);
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
    await handleStats(interaction);
    return;
  }

  if (commandName === "report") {
    await replyInteraction(
      config.discordToken,
      interaction.id,
      interaction.token,
      formatReport(getStats())
    );
    return;
  }

  if (commandName === "config") {
    await replyInteraction(
      config.discordToken,
      interaction.id,
      interaction.token,
      formatConfigSummary()
    );
    return;
  }

  if (commandName === "health") {
    await handleHealth(interaction);
    return;
  }

  if (commandName === "export") {
    const reportPath = writeMarkdownReport(getStats());
    await replyInteraction(
      config.discordToken,
      interaction.id,
      interaction.token,
      `REPORT.mdを更新しました。\n${reportPath}`
    );
  }
}

async function connectGatewayOnce(onClosed) {
  const gatewayUrl = await getGateway(config.discordToken);
  const ws = new WebSocket(`${gatewayUrl}/?v=10&encoding=json`);
  let heartbeatTimer = null;
  let closed = false;

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
    closed = true;
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    console.log("Gateway closed. Reconnecting automatically...");
    onClosed?.();
  });

  ws.addEventListener("error", (error) => {
    console.error("Gateway websocket error:", error.message || "unknown error");
    if (!closed) {
      try {
        ws.close();
      } catch {
        // The close handler will schedule reconnect if the socket is still open enough to emit it.
      }
    }
  });
}

function startGatewayLoop() {
  let reconnectTimer = null;
  let reconnectAttempts = 0;
  let connecting = false;

  const scheduleReconnect = () => {
    if (reconnectTimer) return;
    const delayMs = Math.min(30000, 2000 * Math.max(1, reconnectAttempts));
    reconnectAttempts += 1;
    console.log(`Gateway reconnect scheduled in ${Math.round(delayMs / 1000)} seconds.`);
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      connect();
    }, delayMs);
  };

  const connect = async () => {
    if (connecting) return;
    connecting = true;
    try {
      await connectGatewayOnce(scheduleReconnect);
      reconnectAttempts = 0;
      console.log("Gateway connected. Slash commands are listening.");
    } catch (error) {
      console.error("Gateway connect failed:", error.message);
      scheduleReconnect();
    } finally {
      connecting = false;
    }
  };

  connect();
}

const app = await getApplication(config.discordToken);
applicationId = app.id;
await registerCommands(config.discordToken, app.id, config.guildId);

console.log(`Logged in application: ${app.name}`);
console.log(config.guildId ? "Slash commands registered to test server." : "Global slash commands registered.");
console.log(config.mockMode ? "MOCK_MODE is ON. Nansen data is simulated." : "MOCK_MODE is OFF.");
console.log(`Auto alert policy: max ${config.maxDailyAlerts}/day, dedupe ${config.dedupeHours}h, min score ${config.minBbScore}.`);
console.log(`Tracking interval: ${config.trackingIntervalMinutes} minutes.`);
console.log(`Next auto radar check: in ${config.alertIntervalMinutes} minutes. A check only posts when candidates pass policy.`);

startGatewayLoop();

runTrackingOnce().catch((error) => console.error("initial tracking error:", error.message));
maybePostDailySummary().catch((error) => console.error("initial daily summary error:", error.message));

const intervalMs = Math.max(config.alertIntervalMinutes, 1) * 60 * 1000;
setInterval(() => {
  runRadarOnce().catch((error) => console.error("radar error:", error.message));
}, intervalMs);

const trackingIntervalMs = Math.max(config.trackingIntervalMinutes, 1) * 60 * 1000;
setInterval(() => {
  runTrackingOnce().catch((error) => console.error("tracking loop error:", error.message));
}, trackingIntervalMs);

setInterval(() => {
  maybePostDailySummary().catch((error) => console.error("daily summary error:", error.message));
}, 60 * 1000);
