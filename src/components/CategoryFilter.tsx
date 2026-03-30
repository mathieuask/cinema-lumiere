'use client'

import { useRouter, useSearchParams } from 'next/navigation'

interface Category {
  id: string
  name: string
}

export default function CategoryFilter({ categories }: { categories: Category[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('category')

  function handleClick(categoryName: string | null) {
    const params = new URLSearchParams(searchParams.toString())
    if (categoryName === null || categoryName === active) {
      params.delete('category')
    } else {
      params.set('category', categoryName)
    }
    const query = params.toString()
    router.push(query ? `/?${query}` : '/', { scroll: false })
  }

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      <button
        onClick={() => handleClick(null)}
        className={`rounded-full px-3 py-1 text-sm transition-colors cursor-pointer border ${
          !active
            ? 'bg-primary text-white border-primary'
            : 'bg-card border-border text-muted hover:text-foreground hover:border-primary/50'
        }`}
      >
        All Movies
      </button>
      {categories.map(cat => (
        <button
          key={cat.id}
          onClick={() => handleClick(cat.name)}
          className={`rounded-full px-3 py-1 text-sm transition-colors cursor-pointer border ${
            active === cat.name
              ? 'bg-primary text-white border-primary'
              : 'bg-card border-border text-muted hover:text-foreground hover:border-primary/50'
          }`}
        >
          {cat.name}
        </button>
      ))}
    </div>
  )
}
