import Link from 'next/link'
import { Clock, Star } from 'lucide-react'
import type { MovieWithCategories } from '@/lib/supabase/types'

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

export default function MovieCard({ movie }: { movie: MovieWithCategories }) {
  const categories = movie.movie_categories?.map(mc => mc.categories) ?? []

  return (
    <Link href={`/movies/${movie.id}`} className="group">
      <div className="overflow-hidden rounded-xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5">
        <div className="aspect-[2/3] relative bg-gradient-to-br from-card-hover to-card overflow-hidden">
          {movie.poster_url ? (
            <img
              src={movie.poster_url}
              alt={movie.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Star className="h-16 w-16 text-border group-hover:text-primary/30 transition-colors" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          <div className="absolute bottom-3 left-3 right-3">
            <h3 className="text-lg font-bold leading-tight text-white">{movie.title}</h3>
            {movie.director && (
              <p className="mt-1 text-xs text-gray-300">{movie.director}</p>
            )}
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-2 text-xs text-muted mb-2">
            <Clock className="h-3 w-3" />
            <span>{movie.duration_min} min</span>
            {movie.release_date && (
              <span className="ml-auto">{new Date(movie.release_date).getFullYear()}</span>
            )}
          </div>
          <div className="flex flex-wrap gap-1">
            {categories.map(cat => (
              <span
                key={cat.id}
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${categoryColors[cat.name] || 'bg-gray-500/20 text-gray-400'}`}
              >
                {cat.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </Link>
  )
}
