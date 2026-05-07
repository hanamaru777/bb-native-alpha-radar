# bb Native Alpha Radar Report

Generated at: 2026-05-07T01:31:04.749Z

bb Native Alpha Radar is a Discord bot that uses Nansen Smart Money data to surface Solana lowcap meme candidates before contract addresses are posted in the bb altcoin room.

## Current Results

- Valid radar records: 14
- Tracked records: 2
- Completed 6h tracking: 1
- Today's auto alerts: 0/8

## Post-Alert Performance

| # | Token | Max gain | Alert MC | Max MC | Current MC |
| - | - | -: | -: | -: | -: |
| 1 | [$XANIMALS](https://dexscreener.com/solana/FJtB7uHWLDJA92vv2zdTyGRzMDQ227vivWhEjaeEpump) | +99% | $111.8K | $222.3K | $222.3K |
| 2 | [$ODAI](https://dexscreener.com/solana/HxFSWTJE3SeUCgsKJUcuGQYAiH4S4BFEnSoktfKLpump) | +6% | $194.8K | $205.6K | $199.6K |

## Nansen Usage

- Smart Money netflow
- Smart Money DEX trades
- Token Screener
- Token holders / Flow Intelligence for `/flow` deep dives
- Holder concentration and Flow Intelligence bias in `/flow` verdicts
- Wallet label hints when Nansen holder rows include label/tag/category fields

## Runtime Criteria

- Chain: Solana
- Market cap limit: $500.0K
- Token age limit: 30d
- Minimum bb reaction score: 70
- Minimum Smart Money traders: 3
- Auto alert cap: 8/day
- Dedupe window: 6h
- Radar interval: 30 minutes
- Tracking interval: 15 minutes

## Notes

- This is not financial advice.
- Final decisions should be checked with DexScreener, gmgn, and Nansen.
- Local raw alert history is stored in `data/alerts.json` and is not committed.
