const API_BASE = "https://discord.com/api/v10";

export async function discordRequest(token, path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bot ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Discord API error ${res.status} on ${path}: ${body}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function postMessage(token, channelId, content, components = [], embeds = []) {
  return discordRequest(token, `/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, components, embeds })
  });
}

export async function getRecentMessages(token, channelId, limit = 100) {
  const target = Math.max(1, Math.min(Number(limit) || 100, 500));
  const messages = [];
  let before = "";

  while (messages.length < target) {
    const pageLimit = Math.min(100, target - messages.length);
    const query = new URLSearchParams({ limit: String(pageLimit) });
    if (before) query.set("before", before);

    const page = await discordRequest(token, `/channels/${channelId}/messages?${query.toString()}`);
    if (!Array.isArray(page) || page.length === 0) break;

    messages.push(...page);
    before = page[page.length - 1].id;
    if (page.length < pageLimit) break;
  }

  return messages;
}

export async function getMessage(token, channelId, messageId) {
  return discordRequest(token, `/channels/${channelId}/messages/${messageId}`);
}

export async function replyInteraction(token, interactionId, interactionToken, content) {
  return discordRequest(token, `/interactions/${interactionId}/${interactionToken}/callback`, {
    method: "POST",
    body: JSON.stringify({
      type: 4,
      data: { content }
    })
  });
}

export async function deferInteraction(token, interactionId, interactionToken) {
  return discordRequest(token, `/interactions/${interactionId}/${interactionToken}/callback`, {
    method: "POST",
    body: JSON.stringify({ type: 5 })
  });
}

export async function editInteractionReply(token, applicationId, interactionToken, content, components = [], embeds = []) {
  return discordRequest(token, `/webhooks/${applicationId}/${interactionToken}/messages/@original`, {
    method: "PATCH",
    body: JSON.stringify({ content, components, embeds })
  });
}

export async function getGateway(token) {
  const data = await discordRequest(token, "/gateway/bot");
  return data.url;
}

export async function getApplication(token) {
  return discordRequest(token, "/oauth2/applications/@me");
}

export async function registerCommands(token, applicationId, guildId = "") {
  const commands = [
    { name: "radar", description: "Show Solana lowcap radar candidates" },
    {
      name: "flow",
      description: "Deep-dive a Solana token CA",
      options: [
        {
          name: "ca",
          description: "Solana token contract address",
          type: 3,
          required: true
        }
      ]
    },
    {
      name: "why",
      description: "Explain why a Radar Call picked a CA",
      options: [
        {
          name: "ca",
          description: "Solana token contract address",
          type: 3,
          required: true
        }
      ]
    },
    { name: "leaderboard", description: "Show best tracked Radar Calls" },
    { name: "rejections", description: "Show why candidates were skipped" },
    { name: "stats", description: "Show today's radar daily summary" },
    { name: "health", description: "Check bot and Nansen status" }
  ];

  const path = guildId
    ? `/applications/${applicationId}/guilds/${guildId}/commands`
    : `/applications/${applicationId}/commands`;

  return discordRequest(token, path, {
    method: "PUT",
    body: JSON.stringify(commands)
  });
}
