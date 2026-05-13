import { getMessage } from "./discord.js";
import { config } from "./config.js";

const TRACKED_REACTIONS = {
  "🔥": "fire",
  "👀": "eyes",
  "⚠️": "warning",
  "💀": "skull"
};

function normalizeEmojiName(reaction) {
  return reaction?.emoji?.name || "";
}

export function summarizeReactionsFromMessage(message) {
  const summary = {
    fire: 0,
    eyes: 0,
    warning: 0,
    skull: 0
  };

  for (const reaction of message?.reactions || []) {
    const key = TRACKED_REACTIONS[normalizeEmojiName(reaction)];
    if (key) summary[key] = Number(reaction.count || 0);
  }

  return summary;
}

export async function fetchRadarMessageReactions(alert) {
  const channelId = alert?.discord?.channelId || config.alertChannelId;
  const messageId = alert?.discord?.messageId;
  if (!channelId || !messageId) return null;

  const message = await getMessage(config.discordToken, channelId, messageId);
  return summarizeReactionsFromMessage(message);
}

export function formatReactionSummary(reactions = {}) {
  const fire = Number(reactions.fire || 0);
  const eyes = Number(reactions.eyes || 0);
  const warning = Number(reactions.warning || 0);
  const skull = Number(reactions.skull || 0);
  const total = fire + eyes + warning + skull;
  if (!total) return "まだリアクションなし";
  return `🔥 ${fire} / 👀 ${eyes} / ⚠️ ${warning} / 💀 ${skull}`;
}
