import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { queries } from '@/lib/queries'

export async function POST(request: NextRequest) {
  const { queryId } = await request.json()

  const query = queries.find(q => q.id === queryId)
  if (!query) {
    return NextResponse.json({ error: 'Query not found' }, { status: 404 })
  }

  // Use Supabase's rpc or direct SQL via the postgres connection
  // Since we're server-side, we can use the service role or a direct approach
  // For now, we'll use the Supabase client with a database function

  // Actually, let's create a simple approach: use fetch to the Supabase REST API
  // with a postgres function, or just use the management API

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  // Try using the Supabase SQL endpoint (requires service role)
  // Since we only have anon key, we'll use a different approach
  // Let's create a Postgres function that executes our predefined queries

  // For simplicity, execute each query by ID using PostgREST views or RPC
  // Since we can't run arbitrary SQL, let's manually map queries to PostgREST calls

  try {
    const result = await executeQuery(queryId, supabaseUrl, supabaseKey)
    return NextResponse.json({ data: result })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function executeQuery(queryId: number, url: string, key: string): Promise<any[]> {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json',
  }

  const { createAdminClient } = await import('@/lib/supabase/server')
  const client = createAdminClient()

  switch (queryId) {
    case 1: {
      const { data } = await client.from('rooms').select('name, capacity').order('capacity', { ascending: false })
      return (data ?? []).map(r => ({ salle: r.name, nombre_de_places: r.capacity }))
    }

    case 2: {
      const { data } = await client
        .from('screenings')
        .select('start_time, movies(title), rooms(name)')
        .gte('start_time', '2024-03-01T00:00:00')
        .lte('start_time', '2024-03-07T23:59:59')
        .order('start_time')
      return (data ?? []).map((s: any) => ({
        film: s.movies?.title,
        salle: s.rooms?.name,
        horaire: s.start_time,
      }))
    }

    case 3: {
      const { data } = await client
        .from('screenings')
        .select('movie_id, movies(title)')
        .gte('start_time', '2024-01-01T00:00:00')
        .lte('start_time', '2024-12-31T23:59:59')

      const counts: Record<string, { film: string; count: number }> = {}
      ;(data ?? []).forEach((s: any) => {
        const title = s.movies?.title ?? 'Inconnu'
        if (!counts[title]) counts[title] = { film: title, count: 0 }
        counts[title].count++
      })
      return Object.values(counts).sort((a, b) => b.count - a.count).map(c => ({
        film: c.film,
        nombre_projections: c.count,
      }))
    }

    case 4: {
      const { data: cats } = await client.from('categories').select('id, name')
      const { data: mc } = await client.from('movie_categories').select('category_id')

      const counts: Record<number, number> = {}
      ;(mc ?? []).forEach(r => { counts[r.category_id] = (counts[r.category_id] || 0) + 1 })

      return (cats ?? []).map(c => ({
        categorie: c.name,
        nombre_films: counts[c.id] || 0,
      })).sort((a, b) => b.nombre_films - a.nombre_films)
    }

    case 5: {
      // Action films on March 1, 2024
      const { data: actionCat } = await client.from('categories').select('id').eq('name', 'Action').single()
      if (!actionCat) return []

      const { data: actionMovieIds } = await client.from('movie_categories').select('movie_id').eq('category_id', actionCat.id)
      const movieIds = (actionMovieIds ?? []).map(m => m.movie_id)

      const { data } = await client
        .from('screenings')
        .select('start_time, movies(title), rooms(name)')
        .in('movie_id', movieIds)
        .gte('start_time', '2024-03-01T00:00:00')
        .lte('start_time', '2024-03-01T23:59:59')
        .order('start_time')

      return (data ?? []).map((s: any) => ({
        film: s.movies?.title,
        salle: s.rooms?.name,
        horaire: s.start_time,
      }))
    }

    case 6: {
      // Entries per movie in 2024, excluding documentaries
      const { data: docCat } = await client.from('categories').select('id').eq('name', 'Documentaire').single()
      const { data: docMovies } = await client.from('movie_categories').select('movie_id').eq('category_id', docCat?.id ?? 0)
      const docMovieIds = (docMovies ?? []).map(m => m.movie_id)

      const { data: screenings } = await client
        .from('screenings')
        .select('id, movie_id, movies(title)')
        .gte('start_time', '2024-01-01T00:00:00')
        .lte('start_time', '2024-12-31T23:59:59')

      const validScreenings = (screenings ?? []).filter((s: any) => !docMovieIds.includes(s.movie_id))
      const scrIds = validScreenings.map(s => s.id)

      const { data: res } = await client
        .from('reservations')
        .select('screening_id')
        .in('screening_id', scrIds)
        .eq('status', 'confirmed')

      const movieEntries: Record<string, { film: string; count: number }> = {}
      ;(res ?? []).forEach(r => {
        const scr = validScreenings.find(s => s.id === r.screening_id) as any
        if (scr) {
          const title = scr.movies?.title ?? 'Inconnu'
          if (!movieEntries[title]) movieEntries[title] = { film: title, count: 0 }
          movieEntries[title].count++
        }
      })

      return Object.values(movieEntries).sort((a, b) => b.count - a.count).map(e => ({
        film: e.film,
        nombre_entrees: e.count,
      }))
    }

    case 7: {
      // Average occupancy per room in 2024
      const { data: rooms } = await client.from('rooms').select('*')
      const { data: screenings } = await client
        .from('screenings')
        .select('id, room_id')
        .gte('start_time', '2024-01-01T00:00:00')
        .lte('start_time', '2024-12-31T23:59:59')

      const { data: res } = await client
        .from('reservations')
        .select('screening_id')
        .eq('status', 'confirmed')

      const scrCounts: Record<number, number> = {}
      ;(res ?? []).forEach(r => {
        scrCounts[r.screening_id] = (scrCounts[r.screening_id] || 0) + 1
      })

      return (rooms ?? []).map(room => {
        const roomScrs = (screenings ?? []).filter(s => s.room_id === room.id)
        if (roomScrs.length === 0) return { salle: room.name, capacity: room.capacity, taux_occupation_moyen: 0 }
        const avg = roomScrs.reduce((sum, s) => sum + ((scrCounts[s.id] || 0) * 100.0 / room.capacity), 0) / roomScrs.length
        return { salle: room.name, capacity: room.capacity, taux_occupation_moyen: Math.round(avg * 100) / 100 }
      }).sort((a, b) => b.taux_occupation_moyen - a.taux_occupation_moyen)
    }

    case 8: {
      // Films seen per customer in 2024
      const { data: res } = await client
        .from('reservations')
        .select('customer_id, customers(first_name, last_name), screenings(movie_id, start_time)')
        .eq('status', 'confirmed')

      const customerFilms: Record<string, { first_name: string; last_name: string; movies: Set<number> }> = {}
      ;(res ?? []).forEach((r: any) => {
        if (!r.screenings?.start_time) return
        const year = new Date(r.screenings.start_time).getFullYear()
        if (year !== 2024) return
        const key = r.customer_id
        if (!customerFilms[key]) {
          customerFilms[key] = {
            first_name: r.customers?.first_name ?? '',
            last_name: r.customers?.last_name ?? '',
            movies: new Set(),
          }
        }
        customerFilms[key].movies.add(r.screenings.movie_id)
      })

      return Object.values(customerFilms)
        .map(c => ({ first_name: c.first_name, last_name: c.last_name, films_vus: c.movies.size }))
        .sort((a, b) => b.films_vus - a.films_vus)
    }

    case 9: {
      // Historical films in Jan 2024 in largest room
      const { data: rooms } = await client.from('rooms').select('id, capacity').order('capacity', { ascending: false }).limit(1)
      const largestRoomId = rooms?.[0]?.id
      if (!largestRoomId) return []

      const { data: histCat } = await client.from('categories').select('id').eq('name', 'Historique').single()
      if (!histCat) return []

      const { data: histMovies } = await client.from('movie_categories').select('movie_id').eq('category_id', histCat.id)
      const histMovieIds = (histMovies ?? []).map(m => m.movie_id)

      const { data } = await client
        .from('screenings')
        .select('start_time, movies(title)')
        .in('movie_id', histMovieIds)
        .eq('room_id', largestRoomId)
        .gte('start_time', '2024-01-01T00:00:00')
        .lte('start_time', '2024-01-31T23:59:59')
        .order('start_time')

      return (data ?? []).map((s: any) => ({
        film: s.movies?.title,
        horaire: s.start_time,
      }))
    }

    case 10: {
      // Revenue from Avatar 2 in Feb 2024
      const { data: movie } = await client.from('movies').select('id').eq('title', 'Avatar 2').single()
      if (!movie) return []

      const { data: scrs } = await client
        .from('screenings')
        .select('id')
        .eq('movie_id', movie.id)
        .gte('start_time', '2024-02-01T00:00:00')
        .lte('start_time', '2024-02-29T23:59:59')

      const scrIds = (scrs ?? []).map(s => s.id)

      const { data: res } = await client
        .from('reservations')
        .select('amount_paid')
        .in('screening_id', scrIds)
        .eq('status', 'confirmed')

      const total = (res ?? []).reduce((s, r) => s + Number(r.amount_paid), 0)
      return [{ film: 'Avatar 2', montant_total: Math.round(total * 100) / 100 }]
    }

    case 11: {
      // Top 5 most loyal customers
      const { data: res } = await client
        .from('reservations')
        .select('customer_id, amount_paid, customers(first_name, last_name)')
        .eq('status', 'confirmed')

      const customers: Record<string, { first_name: string; last_name: string; count: number; total: number }> = {}
      ;(res ?? []).forEach((r: any) => {
        const key = r.customer_id
        if (!customers[key]) {
          customers[key] = { first_name: r.customers?.first_name ?? '', last_name: r.customers?.last_name ?? '', count: 0, total: 0 }
        }
        customers[key].count++
        customers[key].total += Number(r.amount_paid)
      })

      return Object.values(customers)
        .sort((a, b) => b.total - a.total)
        .slice(0, 5)
        .map(c => ({
          first_name: c.first_name,
          last_name: c.last_name,
          nb_reservations: c.count,
          total_depense: Math.round(c.total * 100) / 100,
        }))
    }

    case 12: {
      // Monthly revenue in 2024
      const { data: res } = await client
        .from('reservations')
        .select('amount_paid, screenings(start_time)')
        .eq('status', 'confirmed')

      const monthly: Record<number, number> = {}
      ;(res ?? []).forEach((r: any) => {
        if (!r.screenings?.start_time) return
        const d = new Date(r.screenings.start_time)
        if (d.getFullYear() !== 2024) return
        const m = d.getMonth() + 1
        monthly[m] = (monthly[m] || 0) + Number(r.amount_paid)
      })

      return Object.entries(monthly)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([m, v]) => ({ mois: Number(m), recette_mensuelle: Math.round(v * 100) / 100 }))
    }

    case 13: {
      // Films with no reservations
      const { data: movies } = await client.from('movies').select('id, title, director, release_date')
      const { data: scrs } = await client.from('screenings').select('id, movie_id')
      const { data: res } = await client.from('reservations').select('screening_id').eq('status', 'confirmed')

      const reservedMovieIds = new Set(
        (res ?? []).map(r => {
          const scr = (scrs ?? []).find(s => s.id === r.screening_id)
          return scr?.movie_id
        }).filter(Boolean)
      )

      return (movies ?? [])
        .filter(m => !reservedMovieIds.has(m.id))
        .map(m => ({ title: m.title, director: m.director, release_date: m.release_date }))
    }

    case 14: {
      // Pricing distribution
      const { data: res } = await client
        .from('reservations')
        .select('pricing(label)')
        .eq('status', 'confirmed')

      const total = (res ?? []).length
      const dist: Record<string, number> = {}
      ;(res ?? []).forEach((r: any) => {
        const label = r.pricing?.label ?? 'Inconnu'
        dist[label] = (dist[label] || 0) + 1
      })

      return Object.entries(dist)
        .sort(([, a], [, b]) => b - a)
        .map(([label, count]) => ({
          tarif: label,
          nb_utilisations: count,
          pourcentage: Math.round(count * 10000.0 / total) / 100,
        }))
    }

    case 15: {
      // Most profitable screenings (top 10)
      const { data: scrs } = await client
        .from('screenings')
        .select('id, start_time, movies(title), rooms(name, capacity)')

      const { data: res } = await client
        .from('reservations')
        .select('screening_id, amount_paid')
        .eq('status', 'confirmed')

      const scrData: Record<number, { count: number; revenue: number }> = {}
      ;(res ?? []).forEach(r => {
        if (!scrData[r.screening_id]) scrData[r.screening_id] = { count: 0, revenue: 0 }
        scrData[r.screening_id].count++
        scrData[r.screening_id].revenue += Number(r.amount_paid)
      })

      return (scrs ?? [])
        .filter(s => scrData[s.id])
        .map((s: any) => ({
          film: s.movies?.title,
          salle: s.rooms?.name,
          start_time: s.start_time,
          nb_places_vendues: scrData[s.id].count,
          recette_seance: Math.round(scrData[s.id].revenue * 100) / 100,
          taux_remplissage: Math.round(scrData[s.id].count * 10000.0 / (s.rooms?.capacity ?? 1)) / 100,
        }))
        .sort((a: any, b: any) => b.recette_seance - a.recette_seance)
        .slice(0, 10)
    }

    default:
      return []
  }
}
