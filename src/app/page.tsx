import { createClient } from '@/lib/supabase/server'
import MovieCard from '@/components/MovieCard'
import CategoryFilter from '@/components/CategoryFilter'
import type { MovieWithCategories } from '@/lib/supabase/types'
import { Film } from 'lucide-react'

export default async function HomePage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams
  const supabase = await createClient()

  const { data: movies } = await supabase
    .from('movies')
    .select('*, movie_categories(category_id, categories(id, name))')
    .order('release_date', { ascending: false })

  const { data: categories } = await supabase
    .from('categories')
    .select('*')
    .order('name')

  const typedMovies = (movies ?? []) as unknown as MovieWithCategories[]

  const filteredMovies = category
    ? typedMovies.filter(movie =>
        movie.movie_categories?.some(mc => mc.categories.name === category)
      )
    : typedMovies

  const featured = typedMovies[0]

  return (
    <div>
      {/* Hero Section */}
      {featured && (
        <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 via-background to-background">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center gap-10">
              {featured.poster_url && (
                <div className="w-48 md:w-56 flex-shrink-0">
                  <div className="aspect-[2/3] relative rounded-xl overflow-hidden shadow-2xl shadow-primary/20">
                    <img
                      src={featured.poster_url}
                      alt={featured.title}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}
              <div className="flex flex-col items-center md:items-start text-center md:text-left">
                <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm text-primary mb-6">
                  <Film className="h-4 w-4" />
                  Now Showing
                </div>
                <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
                  {featured.title}
                </h1>
                <p className="mt-4 max-w-2xl text-lg text-muted">
                  {featured.synopsis?.slice(0, 200)}...
                </p>
                <div className="mt-6 flex items-center gap-4 text-sm text-muted">
                  <span>Directed by {featured.director}</span>
                  <span>·</span>
                  <span>{featured.duration_min} min</span>
                </div>
                <a
                  href={`/movies/${featured.id}`}
                  className="mt-8 rounded-lg bg-primary px-8 py-3 font-medium text-white hover:bg-primary-hover transition-colors"
                >
                  View Showtimes
                </a>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Movies Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold mb-8">
          {category ? category : 'All Movies'}
        </h2>

        <CategoryFilter categories={categories ?? []} />

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {filteredMovies.map(movie => (
            <MovieCard key={movie.id} movie={movie} />
          ))}
        </div>
      </section>
    </div>
  )
}
