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

export async function postMessage(token, channelId, content, components = []) {
  return discordRequest(token, `/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content, components })
  });
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

export async function editInteractionReply(token, applicationId, interactionToken, content, components = []) {
  return discordRequest(token, `/webhooks/${applicationId}/${interactionToken}/messages/@original`, {
    method: "PATCH",
    body: JSON.stringify({ content, components })
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
    {
      name: "flow",
      description: "CAからNansen風の資金流入分析を返します",
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
      name: "radar",
      description: "Alpha Radarのテスト通知を実行します"
    },
    {
      name: "criteria",
      description: "Alpha Radarの抽出条件を表示します"
    }
  ];

  const path = guildId
    ? `/applications/${applicationId}/guilds/${guildId}/commands`
    : `/applications/${applicationId}/commands`;

  return discordRequest(token, path, {
    method: "PUT",
    body: JSON.stringify(commands)
  });
}
