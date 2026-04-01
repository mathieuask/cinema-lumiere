'use client'

import { useEffect, useState } from 'react'
import { queries } from '@/lib/queries'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { LayoutDashboard, Database, TrendingUp, Users, Ticket, DollarSign, Loader2 } from 'lucide-react'

const COLORS = ['#e50914', '#f5c518', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f97316', '#06b6d4']
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queries'>('dashboard')
  const [stats, setStats] = useState({ reservations: 0, revenue: 0, avgOccupancy: 0, customers: 0 })
  const [revenueByMonth, setRevenueByMonth] = useState<any[]>([])
  const [pricingDistribution, setPricingDistribution] = useState<any[]>([])
  const [topMovies, setTopMovies] = useState<any[]>([])
  const [occupancyByRoom, setOccupancyByRoom] = useState<any[]>([])
  const [queryResults, setQueryResults] = useState<Record<number, any[]>>({})
  const [loadingQuery, setLoadingQuery] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  async function runQuery(id: number) {
    setLoadingQuery(id)
    try {
      const resp = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queryId: id }),
      })
      const { data } = await resp.json()
      if (data) {
        setQueryResults(prev => ({ ...prev, [id]: data }))
      }
    } catch {
      // silently fail
    }
    setLoadingQuery(null)
  }

  useEffect(() => {
    async function fetchChartData() {
      const resp = await fetch('/api/admin/stats')
      const data = await resp.json()
      setStats(data.stats)
      setRevenueByMonth(data.revenueByMonth)
      setPricingDistribution(data.pricingDistribution)
      setTopMovies(data.topMovies)
      setOccupancyByRoom(data.occupancyByRoom)
      setLoading(false)
    }

    fetchChartData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-primary" />
            Admin Dashboard
          </h1>
          <p className="mt-1 text-muted">Cinema Lumière Overview</p>
        </div>

        {/* Tab switcher */}
        <div className="flex rounded-lg bg-card border border-border p-1">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'dashboard' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
            }`}
          >
            <TrendingUp className="inline h-4 w-4 mr-1" />
            Statistics
          </button>
          <button
            onClick={() => setActiveTab('queries')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'queries' ? 'bg-primary text-white' : 'text-muted hover:text-foreground'
            }`}
          >
            <Database className="inline h-4 w-4 mr-1" />
            SQL Queries
          </button>
        </div>
      </div>

      {activeTab === 'dashboard' ? (
        <>
          {/* Stats cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard icon={<Ticket className="h-5 w-5" />} label="Reservations" value={stats.reservations.toString()} color="text-primary" />
            <StatCard icon={<DollarSign className="h-5 w-5" />} label="Total Revenue" value={`${stats.revenue.toFixed(2)} €`} color="text-success" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Occupancy Rate" value={`${stats.avgOccupancy}%`} color="text-accent" />
            <StatCard icon={<Users className="h-5 w-5" />} label="Customers" value={stats.customers.toString()} color="text-blue-400" />
          </div>

          {/* Charts */}
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Revenue by month */}
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-bold mb-4">Revenue by Month (2024)</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis dataKey="name" stroke="#8888a0" fontSize={12} />
                  <YAxis stroke="#8888a0" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }}
                    labelStyle={{ color: '#ededed' }}
                  />
                  <Bar dataKey="revenue" fill="#e50914" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Pricing distribution */}
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-bold mb-4">Pricing Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pricingDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    label={((props: any) => `${props.name ?? ''} ${((props.percent ?? 0) * 100).toFixed(0)}%`) as any}
                  >
                    {pricingDistribution.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Top movies */}
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-bold mb-4">Top 5 Movies by Entries</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topMovies} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis type="number" stroke="#8888a0" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="#8888a0" fontSize={11} width={120} />
                  <Tooltip
                    contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }}
                  />
                  <Bar dataKey="entries" fill="#f5c518" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Occupancy by room */}
            <div className="rounded-xl bg-card border border-border p-6">
              <h3 className="text-lg font-bold mb-4">Occupancy Rate by Room</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={occupancyByRoom} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a3e" />
                  <XAxis type="number" stroke="#8888a0" fontSize={12} domain={[0, 'auto']} />
                  <YAxis dataKey="name" type="category" stroke="#8888a0" fontSize={11} width={100} />
                  <Tooltip
                    contentStyle={{ background: '#12121a', border: '1px solid #2a2a3e', borderRadius: '8px' }}
                    formatter={((value: any) => [`${value}%`, 'Occupancy']) as any}
                  />
                  <Bar dataKey="rate" fill="#22c55e" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      ) : (
        /* SQL Queries Tab */
        <div className="space-y-4">
          <p className="text-muted text-sm mb-6">
            The 15 SQL queries of the project (10 required + 5 custom). Results are computed in real time from the Supabase database.
          </p>

          {queries.map(q => (
            <QueryCard
              key={q.id}
              query={q}
              results={queryResults[q.id]}
              loading={loadingQuery === q.id}
              onRun={() => runQuery(q.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl bg-card border border-border p-5">
      <div className={`${color} mb-2`}>{icon}</div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  )
}

function QueryCard({ query, results, loading, onRun }: {
  query: { id: number; title: string; sql: string }
  results?: any[]
  loading: boolean
  onRun: () => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold">{query.id}.</span>
          <span className="font-medium text-primary">{query.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {results && <span className="text-xs text-success">{results.length} result(s)</span>}
          <button
            onClick={onRun}
            disabled={loading}
            className="rounded-md bg-primary/10 text-primary px-3 py-1.5 text-xs font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Run'}
          </button>
        </div>
      </div>

      <pre className="rounded-lg bg-[#0a0f1a] p-4 text-xs text-muted overflow-x-auto font-mono">
        {query.sql}
      </pre>

      {results && results.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {Object.keys(results[0]).map(key => (
                  <th key={key} className="px-3 py-2 text-left text-xs font-medium text-muted uppercase">
                    {key}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-card-hover">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-3 py-2 text-foreground">
                      {val === null ? <span className="text-muted italic">NULL</span> : String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results && results.length === 0 && (
        <p className="text-sm text-muted italic">No results.</p>
      )}
    </div>
  )
}
