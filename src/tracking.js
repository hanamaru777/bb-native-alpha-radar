import { getSolanaTokenMarketData } from "./marketData.js";
import { getAlertsDueForTracking, updateAlertTracking } from "./store.js";

export async function updateTrackingOnce() {
  const dueAlerts = getAlertsDueForTracking();
  let updated = 0;
  let failed = 0;

  for (const alert of dueAlerts) {
    try {
      const marketData = await getSolanaTokenMarketData(alert.ca);
      if (!marketData?.marketCapUsd) continue;
      updateAlertTracking(alert.ca, marketData);
      updated += 1;
    } catch (error) {
      failed += 1;
      console.error(`tracking error ${alert.symbol || alert.ca}:`, error.message);
    }
  }

  return { checked: dueAlerts.length, updated, failed };
}
