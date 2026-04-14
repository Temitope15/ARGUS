# ARGUS - DeFi Contagion Shield (Phase 1)

ARGUS is a real-time on-chain risk detection system designed to identify early warning signs of DeFi protocol failures. This repository contains **Phase 1: The Data Pipeline**, the foundational layer responsible for high-fidelity data ingestion, normalization, and persistence.

Submitted to the **AVE Claw Hackathon 2026** (Hong Kong Web3 Festival).

## Architecture Overview

Contagion Shield is built in 5 phases:
1.  **Phase 1: Data Pipeline (Current)** - Real-time ingestion via WebSockets and REST polling.
2.  **Phase 2: Risk Engine** - Scoring algorithms for liquidity drain and de-peg detection.
3.  **Phase 3: Smart Money Tracker** - Whale wallet surveillance and intent analysis.
4.  **Phase 4: Alert Layer** - Real-time notifications and automated trade execution.
5.  **Phase 5: React Dashboard** - Visual analytics for global DeFi contagion risk.

## Key Features (Phase 1)

- **Persistent WebSocket Ingestion**: Real-time streams for liquidity events, swap transactions, and price changes.
- **Resilient Polling Engine**: Scheduled snapshots for TVL, pair health (reserves, volumes), and contract risk scores.
- **Unified Schema Storage**: Normalized SQLite time-series data with optimized indexing.
- **Self-Configuring Discovery**: Automatically identifies and monitors top liquidity pairs for targeted tokens.
- **Enterprise Logging**: Structured logging with `pino` for full observability.
- **Failure Recovery**: Automatic WebSocket reconnection with exponential backoff and REST fallback URLs.

## Setup Instructions

### Prerequisites
- Node.js 20+ (LTS recommended)
- npm or bun

### 1. Clone & Install
```bash
git clone <repo-url>
cd contagion-shield
npm install
```

### 2. Environment Setup
Create a `.env` file based on `.env.example`:
```env
AVE_API_KEY=your_api_key_here
INTERNAL_API_PORT=3001
DB_PATH=./data/contagion.db
LOG_LEVEL=info
```

### 3. Run the System
```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm run start
```

## API Documentation

The following internal endpoints are exposed on port `3001` for Phase 2 consumption:

| Endpoint | Description |
| :--- | :--- |
| `GET /api/signals/liquidity-drain` | Returns net liquidity flow for a pair address. |
| `GET /api/signals/tvl-history` | Returns historical TVL/Price snapshots for a token. |
| `GET /api/signals/pair-health` | Latest health metrics (reserves, volume, sell/buy ratio). |
| `GET /api/signals/price-deviation` | Computes price deviation from a baseline in a window. |
| `GET /api/signals/sell-pressure` | Aggregated swap volume and sell/buy transaction ratios. |
| `GET /api/signals/contract-risk` | Latest AVE contract risk score (0-100). |
| `GET /api/health` | System health, uptime, and database statistics. |

## Monitored Protocols

Initially configured to monitor:
- **Ethereum**: USDC, USDT, DAI
- **BSC**: USDT, BUSD

### How to add a new protocol
1. Open `src/config/protocols.js`.
2. Add a new object to the `protocols` array following the existing schema.
3. Restart the system. The Pair Discovery Poller will automatically find and subscribe to the new token's top pairs.

## Project Structure

```text
contagion-shield/
├── src/
│   ├── index.js          # Entry point
│   ├── api/              # REST clients and routes
│   ├── websocket/        # WS manager and event handlers
│   ├── poller/           # Scheduled polling jobs
│   ├── database/         # SQLite persistence and repos
│   ├── normalizer/       # Data schema mapping
│   └── utils/            # Shared utilities (logger, retry)
└── data/                 # SQLite database storage
```

## License
MIT - Developed for AVE Claw Hackathon 2026.
