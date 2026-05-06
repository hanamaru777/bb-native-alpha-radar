const DEXSCREENER_BASE_URL = "https://api.dexscreener.com/latest/dex";

function numberFrom(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function pickBestSolanaPair(pairs) {
  const solanaPairs = pairs.filter((pair) => pair.chainId === "solana");
  if (!solanaPairs.length) return null;

  return solanaPairs.sort((a, b) => {
    const aLiquidity = numberFrom(a.liquidity?.usd) || 0;
    const bLiquidity = numberFrom(b.liquidity?.usd) || 0;
    const aVolume = numberFrom(a.volume?.h24) || 0;
    const bVolume = numberFrom(b.volume?.h24) || 0;
    return (bLiquidity + bVolume) - (aLiquidity + aVolume);
  })[0];
}

export async function getSolanaTokenMarketData(ca) {
  const res = await fetch(`${DEXSCREENER_BASE_URL}/tokens/${encodeURIComponent(ca)}`);
  if (!res.ok) throw new Error(`DexScreener API error ${res.status}`);

  const data = await res.json();
  const pair = pickBestSolanaPair(Array.isArray(data.pairs) ? data.pairs : []);
  if (!pair) return null;

  const marketCapUsd = numberFrom(pair.marketCap) || numberFrom(pair.fdv);
  const priceUsd = numberFrom(pair.priceUsd);
  const volume24hUsd = numberFrom(pair.volume?.h24);
  const liquidityUsd = numberFrom(pair.liquidity?.usd);

  return {
    ca,
    symbol: pair.baseToken?.symbol || null,
    name: pair.baseToken?.name || null,
    marketCapUsd,
    priceUsd,
    volume24hUsd,
    liquidityUsd,
    pairUrl: pair.url || null,
    fetchedAt: new Date().toISOString()
  };
}
