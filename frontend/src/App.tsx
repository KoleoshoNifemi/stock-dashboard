import { useEffect, useState } from 'react'
import { api } from './api'
import { useFetch } from './hooks/useFetch'
import type { Range } from './types'
import { SearchBar } from './components/SearchBar'
import { IndexTicker } from './components/IndexTicker'
import { Watchlist } from './components/Watchlist'
import { StockHeader } from './components/StockHeader'
import { PriceChart } from './components/PriceChart'
import { KeyStats } from './components/KeyStats'
import { CompanyProfile } from './components/CompanyProfile'
import { NewsList } from './components/NewsList'

// The selected symbol lives in the URL hash so refreshes and shared links keep it.
function symbolFromHash(): string {
  return decodeURIComponent(window.location.hash.slice(1)).toUpperCase() || 'AAPL'
}

export default function App() {
  const [symbol, setSymbol] = useState(symbolFromHash)
  const [range, setRange] = useState<Range>('1mo')
  const [watchlist, setWatchlist] = useState<string[]>([])
  const [watchlistError, setWatchlistError] = useState<string | null>(null)

  useEffect(() => {
    const onHash = () => setSymbol(symbolFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  useEffect(() => {
    api.watchlist().then(setWatchlist).catch((e: Error) => setWatchlistError(e.message))
  }, [])

  const select = (s: string) => {
    window.location.hash = encodeURIComponent(s.toUpperCase())
  }

  const quoteState = useFetch(() => api.quotes([symbol]), [symbol], 15_000)
  const quote = quoteState.data?.find((q) => q.symbol === symbol) ?? null
  const summaryState = useFetch(() => api.summary(symbol), [symbol])
  const summary = summaryState.data?.symbol === symbol ? summaryState.data : null

  const inWatchlist = watchlist.includes(symbol)

  async function toggleWatchlist(s: string) {
    try {
      setWatchlist(watchlist.includes(s) ? await api.removeFromWatchlist(s) : await api.addToWatchlist(s))
      setWatchlistError(null)
    } catch (e) {
      setWatchlistError((e as Error).message)
    }
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">▲</span> Stock Dashboard
        </div>
        <SearchBar onSelect={select} />
      </header>

      <IndexTicker onSelect={select} />

      {watchlistError && <div className="banner">Backend problem: {watchlistError}. Is the API running on port 5000?</div>}

      <div className="layout">
        <Watchlist symbols={watchlist} selected={symbol} onSelect={select} onRemove={toggleWatchlist} />

        <main className="main">
          {quote ? (
            <>
              <section className="card">
                <StockHeader quote={quote} inWatchlist={inWatchlist} onToggleWatchlist={() => toggleWatchlist(symbol)} />
              </section>
              <PriceChart symbol={symbol} currency={quote.currency} range={range} onRangeChange={setRange} />
              <div className="two-col">
                <KeyStats quote={quote} summary={summary} />
                <NewsList symbol={symbol} />
              </div>
              {summary && <CompanyProfile summary={summary} />}
            </>
          ) : (
            <section className="card empty">
              {quoteState.loading ? (
                <p className="muted">Loading {symbol}…</p>
              ) : (
                <p className="muted">
                  {quoteState.error ?? `No quote found for "${symbol}".`} Try searching for another ticker.
                </p>
              )}
            </section>
          )}
        </main>
      </div>

      <footer className="footer muted small">Market data from Yahoo Finance · may be delayed · not financial advice</footer>
    </div>
  )
}
