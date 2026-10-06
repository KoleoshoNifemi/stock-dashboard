export type Range = '1d' | '5d' | '1mo' | '6mo' | '1y' | '5y'

export interface Quote {
  symbol: string
  name: string
  price: number | null
  change: number | null
  changePercent: number | null
  previousClose: number | null
  open: number | null
  dayHigh: number | null
  dayLow: number | null
  volume: number | null
  marketCap: number | null
  currency: string
  exchange: string | null
  marketState: string | null
}

export interface PricePoint {
  time: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface History {
  symbol: string
  range: Range
  interval: string
  points: PricePoint[]
}

export interface Summary {
  symbol: string
  name: string
  sector: string | null
  industry: string | null
  website: string | null
  employees: number | null
  description: string | null
  stats: {
    marketCap: number | null
    peRatio: number | null
    forwardPE: number | null
    eps: number | null
    beta: number | null
    dividendYield: number | null
    fiftyTwoWeekHigh: number | null
    fiftyTwoWeekLow: number | null
    averageVolume: number | null
  }
}

export interface SearchResult {
  symbol: string
  name: string
  type: string
  exchange: string
}

export interface NewsItem {
  id: string
  title: string
  publisher: string
  link: string
  publishedAt: string
  thumbnail: string | null
}
