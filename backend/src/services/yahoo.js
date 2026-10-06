import YahooFinance from "yahoo-finance2";
import { cached } from "../lib/cache.js";

const yf = new YahooFinance({ suppressNotices: ["yahooSurvey"] });

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const DAY = 24 * 60 * MINUTE;

// Chart range -> how far back to look and which candle interval to use.
export const RANGES = {
  "1d": { lookback: 1 * DAY, interval: "5m" },
  "5d": { lookback: 5 * DAY, interval: "30m" },
  "1mo": { lookback: 31 * DAY, interval: "1d" },
  "6mo": { lookback: 183 * DAY, interval: "1d" },
  "1y": { lookback: 365 * DAY, interval: "1d" },
  "5y": { lookback: 5 * 365 * DAY, interval: "1wk" },
};

export const INDICES = ["^GSPC", "^IXIC", "^DJI", "^RUT", "^VIX"];

function toQuote(q) {
  return {
    symbol: q.symbol,
    name: q.longName ?? q.shortName ?? q.symbol,
    price: q.regularMarketPrice ?? null,
    change: q.regularMarketChange ?? null,
    changePercent: q.regularMarketChangePercent ?? null,
    previousClose: q.regularMarketPreviousClose ?? null,
    open: q.regularMarketOpen ?? null,
    dayHigh: q.regularMarketDayHigh ?? null,
    dayLow: q.regularMarketDayLow ?? null,
    volume: q.regularMarketVolume ?? null,
    marketCap: q.marketCap ?? null,
    currency: q.currency ?? "USD",
    exchange: q.fullExchangeName ?? q.exchange ?? null,
    marketState: q.marketState ?? null,
  };
}

export async function getQuotes(symbols) {
  const key = `quotes:${[...symbols].sort().join(",")}`;
  return cached(key, 15 * SECOND, async () => {
    const results = await yf.quote(symbols);
    const list = Array.isArray(results) ? results : [results];
    return list.filter(Boolean).map(toQuote);
  });
}

export async function getHistory(symbol, range) {
  const { lookback, interval } = RANGES[range];
  // Intraday ranges change quickly; longer ranges can be cached longer.
  const ttl = interval.endsWith("m") ? MINUTE : 15 * MINUTE;

  return cached(`history:${symbol}:${range}`, ttl, async () => {
    // For 1d, look back a few extra days so weekends/holidays still show the last session.
    const period1 = new Date(Date.now() - (range === "1d" ? 4 * DAY : lookback));
    const result = await yf.chart(symbol, { period1, interval });

    let points = result.quotes
      .filter((p) => p.close != null)
      .map((p) => ({
        time: p.date.getTime(),
        open: p.open,
        high: p.high,
        low: p.low,
        close: p.close,
        volume: p.volume ?? 0,
      }));

    if (range === "1d" && points.length) {
      // Keep only the most recent trading session.
      const lastDay = new Date(points.at(-1).time).toDateString();
      points = points.filter((p) => new Date(p.time).toDateString() === lastDay);
    }

    return { symbol, range, interval, points };
  });
}

export async function getSummary(symbol) {
  return cached(`summary:${symbol}`, 10 * MINUTE, async () => {
    const s = await yf.quoteSummary(symbol, {
      modules: ["summaryProfile", "summaryDetail", "defaultKeyStatistics", "price"],
    });
    const d = s.summaryDetail ?? {};
    const k = s.defaultKeyStatistics ?? {};
    const p = s.summaryProfile ?? {};

    return {
      symbol,
      name: s.price?.longName ?? s.price?.shortName ?? symbol,
      sector: p.sector ?? null,
      industry: p.industry ?? null,
      website: p.website ?? null,
      employees: p.fullTimeEmployees ?? null,
      description: p.longBusinessSummary ?? null,
      stats: {
        marketCap: d.marketCap ?? null,
        peRatio: d.trailingPE ?? null,
        forwardPE: d.forwardPE ?? null,
        eps: k.trailingEps ?? null,
        beta: d.beta ?? null,
        dividendYield: d.dividendYield ?? null,
        fiftyTwoWeekHigh: d.fiftyTwoWeekHigh ?? null,
        fiftyTwoWeekLow: d.fiftyTwoWeekLow ?? null,
        averageVolume: d.averageVolume ?? null,
      },
    };
  });
}

export async function search(query) {
  return cached(`search:${query.toLowerCase()}`, 5 * MINUTE, async () => {
    const res = await yf.search(query, { quotesCount: 8, newsCount: 0 });
    return res.quotes
      .filter((q) => q.isYahooFinance && ["EQUITY", "ETF", "INDEX", "CRYPTOCURRENCY"].includes(q.quoteType))
      .map((q) => ({
        symbol: q.symbol,
        name: q.longname ?? q.shortname ?? q.symbol,
        type: q.typeDisp ?? q.quoteType,
        exchange: q.exchDisp ?? q.exchange,
      }));
  });
}

export async function getNews(symbol) {
  return cached(`news:${symbol}`, 10 * MINUTE, async () => {
    const res = await yf.search(symbol, { quotesCount: 0, newsCount: 10 });
    return (res.news ?? []).map((n) => ({
      id: n.uuid,
      title: n.title,
      publisher: n.publisher,
      link: n.link,
      publishedAt: new Date(n.providerPublishTime).toISOString(),
      thumbnail: n.thumbnail?.resolutions?.at(-1)?.url ?? null,
    }));
  });
}
