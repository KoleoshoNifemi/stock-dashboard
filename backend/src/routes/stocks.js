import { Router } from "express";
import { RANGES, INDICES, getQuotes, getHistory, getSummary, getNews, search } from "../services/yahoo.js";

const router = Router();

const SYMBOL_RE = /^[A-Za-z0-9.^=\-]{1,15}$/;

function parseSymbol(raw) {
  const symbol = String(raw ?? "").trim().toUpperCase();
  if (!SYMBOL_RE.test(symbol)) {
    const err = new Error(`Invalid symbol: "${raw}"`);
    err.status = 400;
    throw err;
  }
  return symbol;
}

// GET /api/search?q=apple
router.get("/search", async (req, res) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) return res.json([]);
  res.json(await search(q));
});

// GET /api/quotes?symbols=AAPL,MSFT
router.get("/quotes", async (req, res) => {
  const symbols = String(req.query.symbols ?? "")
    .split(",")
    .filter((s) => s.trim())
    .slice(0, 50)
    .map(parseSymbol);
  if (!symbols.length) return res.json([]);
  res.json(await getQuotes(symbols));
});

// GET /api/market/indices
router.get("/market/indices", async (_req, res) => {
  res.json(await getQuotes(INDICES));
});

// GET /api/stocks/AAPL/history?range=1mo
router.get("/stocks/:symbol/history", async (req, res) => {
  const symbol = parseSymbol(req.params.symbol);
  const range = String(req.query.range ?? "1mo");
  if (!RANGES[range]) {
    return res.status(400).json({ error: `range must be one of: ${Object.keys(RANGES).join(", ")}` });
  }
  res.json(await getHistory(symbol, range));
});

// GET /api/stocks/AAPL/summary
router.get("/stocks/:symbol/summary", async (req, res) => {
  res.json(await getSummary(parseSymbol(req.params.symbol)));
});

// GET /api/stocks/AAPL/news
router.get("/stocks/:symbol/news", async (req, res) => {
  res.json(await getNews(parseSymbol(req.params.symbol)));
});

export default router;
