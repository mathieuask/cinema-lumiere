import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createAdminClient()

  const { data: allRes } = await supabase
    .from('reservations')
    .select('amount_paid, customer_id, screening_id, screenings(start_time), pricing(label)')
    .eq('status', 'confirmed')

  const { count: customerCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })

  const { data: rooms } = await supabase.from('rooms').select('*')
  const { data: screenings } = await supabase.from('screenings').select('id, room_id')

  const { data: movieRes } = await supabase
    .from('reservations')
    .select('screening_id, screenings(movies(title))')
    .eq('status', 'confirmed')

  // Stats
  const totalRevenue = (allRes ?? []).reduce((sum: number, r: any) => sum + Number(r.amount_paid), 0)

  // Revenue by month
  const monthlyRevenue: Record<number, number> = {}
  ;(allRes ?? []).forEach((r: any) => {
    if (r.screenings?.start_time) {
      const month = new Date(r.screenings.start_time).getMonth()
      monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Number(r.amount_paid)
    }
  })
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const revenueByMonth = Object.entries(monthlyRevenue)
    .map(([m, v]) => ({ name: MONTHS[Number(m)], revenue: Math.round(v * 100) / 100 }))
    .sort((a, b) => MONTHS.indexOf(a.name) - MONTHS.indexOf(b.name))

  // Pricing distribution
  const pricingDist: Record<string, number> = {}
  ;(allRes ?? []).forEach((r: any) => {
    const label = r.pricing?.label ?? 'Unknown'
    pricingDist[label] = (pricingDist[label] || 0) + 1
  })
  const pricingDistribution = Object.entries(pricingDist).map(([name, value]) => ({ name, value }))

  // Top movies
  const movieCount: Record<string, number> = {}
  ;(movieRes ?? []).forEach((r: any) => {
    const title = r.screenings?.movies?.title
    if (title) movieCount[title] = (movieCount[title] || 0) + 1
  })
  const topMovies = Object.entries(movieCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([name, entries]) => ({ name: name.length > 18 ? name.slice(0, 18) + '…' : name, entries }))

  // Occupancy by room
  const screeningResCounts: Record<number, number> = {}
  ;(allRes ?? []).forEach((r: any) => {
    screeningResCounts[r.screening_id] = (screeningResCounts[r.screening_id] || 0) + 1
  })

  const occupancyByRoom = (rooms ?? []).map(room => {
    const roomScreenings = (screenings ?? []).filter(s => s.room_id === room.id)
    if (roomScreenings.length === 0) return { name: room.name, rate: 0 }
    const avgOcc = roomScreenings.reduce((sum, s) => {
      return sum + ((screeningResCounts[s.id] || 0) / room.capacity) * 100
    }, 0) / roomScreenings.length
    return { name: room.name, rate: Math.round(avgOcc * 100) / 100 }
  }).sort((a, b) => b.rate - a.rate)

  const overallAvg = occupancyByRoom.length > 0
    ? occupancyByRoom.reduce((s, r) => s + r.rate, 0) / occupancyByRoom.length
    : 0

  return NextResponse.json({
    stats: {
      reservations: (allRes ?? []).length,
      revenue: Math.round(totalRevenue * 100) / 100,
      avgOccupancy: Math.round(overallAvg * 100) / 100,
      customers: customerCount ?? 0,
    },
    revenueByMonth,
    pricingDistribution,
    topMovies,
    occupancyByRoom,
  })
}
