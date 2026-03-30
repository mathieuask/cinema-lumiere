import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Clock, Calendar, MapPin, Ticket } from 'lucide-react'
import type { MovieWithCategories, Screening } from '@/lib/supabase/types'

const categoryColors: Record<string, string> = {
  'Action': 'bg-red-500/20 text-red-400',
  'Comédie': 'bg-yellow-500/20 text-yellow-400',
  'Drame': 'bg-blue-500/20 text-blue-400',
  'Science-Fiction': 'bg-purple-500/20 text-purple-400',
  'Horreur': 'bg-orange-500/20 text-orange-400',
  'Animation': 'bg-green-500/20 text-green-400',
  'Documentaire': 'bg-teal-500/20 text-teal-400',
  'Historique': 'bg-amber-500/20 text-amber-400',
  'Thriller': 'bg-pink-500/20 text-pink-400',
  'Romance': 'bg-rose-500/20 text-rose-400',
}

export default async function MoviePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: movie } = await supabase
    .from('movies')
    .select('*, movie_categories(category_id, categories(id, name))')
    .eq('id', id)
    .single()

  if (!movie) notFound()

  const typedMovie = movie as unknown as MovieWithCategories

  const { data: screenings } = await supabase
    .from('screenings')
    .select('*, rooms(id, name, capacity)')
    .eq('movie_id', id)
    .order('start_time', { ascending: true })

  const categories = typedMovie.movie_categories?.map(mc => mc.categories) ?? []

  // Group screenings by date
  const screeningsByDate: Record<string, typeof screenings> = {}
  screenings?.forEach(s => {
    const date = new Date(s.start_time).toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    if (!screeningsByDate[date]) screeningsByDate[date] = []
    screeningsByDate[date]!.push(s)
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Movie Header */}
      <div className="flex flex-col md:flex-row gap-8">
        {/* Poster */}
        <div className="w-full md:w-72 flex-shrink-0">
          <div className="aspect-[2/3] rounded-xl bg-gradient-to-br from-card-hover to-card border border-border overflow-hidden relative">
            {typedMovie.poster_url ? (
              <img
                src={typedMovie.poster_url}
                alt={typedMovie.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Ticket className="h-20 w-20 text-border" />
              </div>
            )}
          </div>
        </div>

        {/* Movie info */}
        <div className="flex-1">
          <h1 className="text-4xl font-bold">{typedMovie.title}</h1>

          <div className="mt-3 flex flex-wrap gap-2">
            {categories.map(cat => (
              <span
                key={cat.id}
                className={`rounded-full px-3 py-1 text-sm font-medium ${categoryColors[cat.name] || 'bg-gray-500/20 text-gray-400'}`}
              >
                {cat.name}
              </span>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-6 text-sm text-muted">
            {typedMovie.director && (
              <span>Directed by <strong className="text-foreground">{typedMovie.director}</strong></span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {typedMovie.duration_min} min
            </span>
            {typedMovie.release_date && (
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {new Date(typedMovie.release_date).toLocaleDateString('en-US')}
              </span>
            )}
          </div>

          {typedMovie.synopsis && (
            <p className="mt-6 text-muted leading-relaxed">{typedMovie.synopsis}</p>
          )}
        </div>
      </div>

      {/* Screenings */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-6">Showtimes</h2>

        {Object.keys(screeningsByDate).length === 0 ? (
          <p className="text-muted">No showtimes scheduled for this movie.</p>
        ) : (
          <div className="space-y-6">
            {Object.entries(screeningsByDate).map(([date, dateScreenings]) => (
              <div key={date}>
                <h3 className="text-lg font-semibold text-muted capitalize mb-3">{date}</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {dateScreenings?.map((s: any) => (
                    <Link
                      key={s.id}
                      href={`/booking/${s.id}`}
                      className="flex items-center justify-between rounded-xl bg-card border border-border p-4 hover:border-primary/50 hover:bg-card-hover transition-all group"
                    >
                      <div>
                        <p className="font-semibold">
                          {new Date(s.start_time).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true,
                          })}
                        </p>
                        <p className="text-sm text-muted flex items-center gap-1 mt-1">
                          <MapPin className="h-3 w-3" />
                          {s.rooms?.name}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-primary">{Number(s.base_price).toFixed(2)} €</p>
                        <p className="text-xs text-muted group-hover:text-primary transition-colors">
                          Book Now →
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
