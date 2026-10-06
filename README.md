# Stock Dashboard

A full-stack stock dashboard. The frontend is React + TypeScript (Vite) and the backend is Node + Express.

**No API keys needed.** Market data comes from Yahoo Finance through the [`yahoo-finance2`](https://github.com/gadicc/yahoo-finance2) package.

## Features
- Live quotes that auto-refresh, plus a strip showing the major indices (S&P 500, Nasdaq, Dow, Russell 2000, VIX)
- Search with autocomplete for stocks, ETFs, indices, and crypto (arrow keys and Enter work)
- Price chart with 1D / 5D / 1M / 6M / 1Y / 5Y ranges
- Key stats: P/E, EPS, market cap, 52-week range, beta, dividend yield, and more
- Company profile and latest news
- A watchlist saved on the backend (`backend/data/watchlist.json`)
- Dark and light themes, and a responsive layout for mobile

## Run it
```bash
npm run install:all   # first time only
npm run dev           # starts the API on :5000 and the web app on :5173
```
Open http://localhost:5173.

## Project layout
```
backend/                 Express API (port 5000)
  src/server.js          app setup, CORS, error handling
  src/routes/stocks.js   search, quotes, history, summary, news
  src/routes/watchlist.js
  src/services/yahoo.js  Yahoo Finance calls + response shaping
  src/lib/cache.js       in-memory TTL cache
frontend/                React + TS (Vite proxies /api -> :5000)
  src/api.ts             typed API client
  src/components/        UI components
```

## API
| Method | Path | Description |
|---|---|---|
| GET | `/api/search?q=apple` | Symbol search |
| GET | `/api/quotes?symbols=AAPL,MSFT` | Quotes for up to 50 symbols |
| GET | `/api/market/indices` | Major index quotes |
| GET | `/api/stocks/:symbol/history?range=1mo` | Price history (`1d,5d,1mo,6mo,1y,5y`) |
| GET | `/api/stocks/:symbol/summary` | Company profile + key stats |
| GET | `/api/stocks/:symbol/news` | Recent news |
| GET/POST/DELETE | `/api/watchlist[/:symbol]` | Read, add to, or remove from the watchlist |

## Config (optional)
- Backend: `PORT` (default `5000`) and `CLIENT_ORIGIN` (default `http://localhost:5173`, used for CORS)
- Frontend: `VITE_API_URL`, for when the API is hosted somewhere else in production
