'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { User, Ticket, Film, MapPin, Calendar, Clock, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react'

interface ReservationRow {
  id: number
  amount_paid: number
  reserved_at: string
  status: string
  seats: { row_letter: string; seat_number: number; seat_type: string } | null
  pricing: { label: string } | null
  screenings: {
    start_time: string
    movies: { title: string } | null
    rooms: { name: string } | null
  } | null
}

export default function AccountPage() {
  const supabase = createClient()
  const router = useRouter()
  const [reservations, setReservations] = useState<ReservationRow[]>([])
  const [loading, setLoading] = useState(true)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [showReservations, setShowReservations] = useState(false)
  const [cancellingId, setCancellingId] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      setFirstName(user.user_metadata?.first_name ?? '')
      setLastName(user.user_metadata?.last_name ?? '')
      setEmail(user.email ?? '')

      // Look up the customer row by email to get the correct customer_id
      const { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('email', user.email)
        .single()

      // Try with customer.id first, fall back to user.id (auth UUID)
      const customerId = customer?.id ?? user.id

      const { data } = await supabase
        .from('reservations')
        .select('id, amount_paid, reserved_at, status, seats(row_letter, seat_number, seat_type), pricing(label), screenings(start_time, movies(title), rooms(name))')
        .eq('customer_id', customerId)
        .order('reserved_at', { ascending: false })

      setReservations((data as unknown as ReservationRow[]) ?? [])
      setLoading(false)
    }
    load()
  }, [])

  const handleCancel = async (id: number) => {
    setCancellingId(id)
    const { error } = await supabase
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', id)

    if (!error) {
      setReservations(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r)
      )
    }
    setCancellingId(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const activeReservations = reservations.filter(r => r.status.trim() === 'confirmed')
  const cancelledReservations = reservations.filter(r => r.status.trim() === 'cancelled')

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Profile */}
      <div className="rounded-xl bg-card border border-border p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{firstName} {lastName}</h1>
            <p className="text-sm text-muted">{email}</p>
          </div>
        </div>
      </div>

      {/* My Reservations button */}
      <button
        onClick={() => setShowReservations(!showReservations)}
        className="mt-6 w-full flex items-center justify-between rounded-xl bg-card border border-border p-4 hover:border-primary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <Ticket className="h-5 w-5 text-primary" />
          <span className="font-semibold">My Reservations ({reservations.length})</span>
        </div>
        {showReservations
          ? <ChevronUp className="h-5 w-5 text-muted" />
          : <ChevronDown className="h-5 w-5 text-muted" />
        }
      </button>

      {/* Reservations list */}
      {showReservations && (
        <div className="mt-4 space-y-3">
          {reservations.length === 0 ? (
            <div className="rounded-xl bg-card border border-border p-8 text-center">
              <p className="text-muted">No reservations yet.</p>
              <a href="/" className="mt-3 inline-block text-primary hover:underline text-sm">
                Browse movies
              </a>
            </div>
          ) : (
            <>
              {activeReservations.length > 0 && (
                <div className="space-y-3">
                  {activeReservations.map(r => (
                    <div
                      key={r.id}
                      className="rounded-xl bg-card border border-border p-4 flex items-center justify-between gap-4"
                    >
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <Film className="h-4 w-4 text-primary" />
                          <span className="font-semibold">{r.screenings?.movies?.title ?? 'Unknown movie'}</span>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm text-muted">
                          {r.screenings?.start_time && (
                            <>
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(r.screenings.start_time).toLocaleDateString('en-US', {
                                  day: 'numeric', month: 'long', year: 'numeric',
                                })}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {new Date(r.screenings.start_time).toLocaleTimeString('en-US', {
                                  hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </>
                          )}
                          {r.screenings?.rooms?.name && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {r.screenings.rooms.name}
                            </span>
                          )}
                          {r.seats && (
                            <span>Seat {r.seats.row_letter}{r.seats.seat_number}</span>
                          )}
                          {r.pricing?.label && (
                            <span>{r.pricing.label}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-lg font-bold text-primary">{Number(r.amount_paid).toFixed(2)} €</p>
                        <button
                          onClick={() => handleCancel(r.id)}
                          disabled={cancellingId === r.id}
                          className="mt-2 flex items-center gap-1 rounded-lg bg-danger/20 border border-danger/20 px-3 py-1.5 text-xs text-danger hover:bg-danger/30 transition-colors disabled:opacity-50"
                        >
                          {cancellingId === r.id
                            ? <Loader2 className="h-3 w-3 animate-spin" />
                            : <XCircle className="h-3 w-3" />
                          }
                          Cancel reservation
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cancelledReservations.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-muted mb-2">Cancelled reservations</p>
                  <div className="space-y-2">
                    {cancelledReservations.map(r => (
                      <div
                        key={r.id}
                        className="rounded-xl bg-card border border-danger/20 p-4 opacity-60 flex items-center justify-between gap-4"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <Film className="h-4 w-4 text-muted" />
                            <span className="font-semibold">{r.screenings?.movies?.title ?? 'Unknown movie'}</span>
                            <span className="rounded-full bg-danger/20 text-danger px-2 py-0.5 text-xs">Cancelled</span>
                          </div>
                          <div className="flex flex-wrap gap-4 text-sm text-muted">
                            {r.screenings?.start_time && (
                              <span>{new Date(r.screenings.start_time).toLocaleDateString('en-US', {
                                day: 'numeric', month: 'long', year: 'numeric',
                              })}</span>
                            )}
                            {r.seats && (
                              <span>Seat {r.seats.row_letter}{r.seats.seat_number}</span>
                            )}
                          </div>
                        </div>
                        <p className="text-lg font-bold text-muted line-through">{Number(r.amount_paid).toFixed(2)} €</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
