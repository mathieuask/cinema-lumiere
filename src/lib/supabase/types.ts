export interface Movie {
  id: number
  title: string
  synopsis: string | null
  duration_min: number
  release_date: string | null
  poster_url: string | null
  director: string | null
}

export interface Category {
  id: number
  name: string
}

export interface MovieCategory {
  movie_id: number
  category_id: number
  categories?: Category
}

export interface Room {
  id: number
  name: string
  capacity: number
}

export interface Seat {
  id: number
  room_id: number
  row_letter: string
  seat_number: number
  seat_type: string
}

export interface Screening {
  id: number
  movie_id: number
  room_id: number
  start_time: string
  base_price: number
  movies?: Movie
  rooms?: Room
}

export interface Pricing {
  id: number
  label: string
  multiplier: number
}

export interface Customer {
  id: string
  first_name: string
  last_name: string
  email: string
  birth_date: string | null
  created_at: string
}

export interface Reservation {
  id: number
  customer_id: string
  screening_id: number
  seat_id: number
  pricing_id: number
  amount_paid: number
  reserved_at: string
  status: string
  screenings?: Screening & { movies?: Movie; rooms?: Room }
  seats?: Seat
  pricing?: Pricing
}

export interface MovieWithCategories extends Movie {
  movie_categories: { categories: Category }[]
}
