import { Area, AreaChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { api } from '../api'
import { useFetch } from '../hooks/useFetch'
import { formatPercent, formatPrice } from '../lib/format'
import type { Range } from '../types'

const RANGES: Range[] = ['1d', '5d', '1mo', '6mo', '1y', '5y']

interface Props {
  symbol: string
  currency: string
  range: Range
  onRangeChange: (range: Range) => void
}

function formatTick(time: number, range: Range): string {
  const d = new Date(time)
  if (range === '1d') return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
  if (range === '5d') return d.toLocaleDateString('en-US', { weekday: 'short' })
  if (range === '5y') return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTooltipTime(time: number, range: Range): string {
  const d = new Date(time)
  const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  return range === '1d' || range === '5d'
    ? `${date}, ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`
    : date
}

export function PriceChart({ symbol, currency, range, onRangeChange }: Props) {
  // Refresh the intraday chart every minute; longer ranges don't need it.
  const { data, error, loading } = useFetch(
    () => api.history(symbol, range),
    [symbol, range],
    range === '1d' ? 60_000 : undefined,
  )
  const points = data?.symbol === symbol && data.range === range ? data.points : []

  const first = points[0]?.close
  const last = points.at(-1)?.close
  const periodChange = first && last ? ((last - first) / first) * 100 : null
  const up = (periodChange ?? 0) >= 0
  const color = up ? 'var(--up)' : 'var(--down)'

  return (
    <section className="card">
      <div className="chart-toolbar">
        <div>
          <h2>Price</h2>
          {periodChange != null && (
            <span className={`small ${up ? 'up' : 'down'}`}>
              {formatPercent(periodChange)} over {range}
            </span>
          )}
        </div>
        <div className="range-tabs" role="tablist">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={r === range}
              className={r === range ? 'active' : ''}
              onClick={() => onRangeChange(r)}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="chart-body">
        {error && <div className="chart-msg down">{error}</div>}
        {!error && loading && points.length === 0 && <div className="chart-msg muted">Loading chart…</div>}
        {!error && !loading && points.length === 0 && <div className="chart-msg muted">No data for this range.</div>}
        {points.length > 0 && (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--grid)" vertical={false} />
              <XAxis
                dataKey="time"
                type="number"
                scale="time"
                domain={['dataMin', 'dataMax']}
                tickFormatter={(t: number) => formatTick(t, range)}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                minTickGap={40}
              />
              <YAxis
                domain={['auto', 'auto']}
                orientation="right"
                tickFormatter={(v: number) => v.toFixed(v < 10 ? 2 : 0)}
                tick={{ fill: 'var(--muted)', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={56}
              />
              {first != null && <ReferenceLine y={first} stroke="var(--muted)" strokeDasharray="3 3" strokeOpacity={0.5} />}
              <Tooltip
                contentStyle={{
                  background: 'var(--surface-2)',
                  border: '1px solid var(--border)',
                  borderRadius: 8,
                  color: 'var(--text)',
                }}
                labelFormatter={(t) => formatTooltipTime(Number(t), range)}
                formatter={(v) => [formatPrice(Number(v), currency), 'Close']}
              />
              <Area
                type="monotone"
                dataKey="close"
                stroke={color}
                strokeWidth={2}
                fill="url(#priceFill)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}
