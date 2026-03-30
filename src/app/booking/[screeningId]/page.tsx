'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import SeatMap from '@/components/SeatMap'
import type { Seat, Pricing } from '@/lib/supabase/types'
import { Film, MapPin, Calendar, Clock, CreditCard, Loader2, Minus, Plus } from 'lucide-react'

export default function BookingPage() {
  const { screeningId } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [screening, setScreening] = useState<any>(null)
  const [seats, setSeats] = useState<Seat[]>([])
  const [reservedSeatIds, setReservedSeatIds] = useState<number[]>([])
  const [pricingOptions, setPricingOptions] = useState<Pricing[]>([])
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([])
  const [selectedPricing, setSelectedPricing] = useState<Pricing | null>(null)
  const [loading, setLoading] = useState(true)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function load() {
      const { data: scr } = await supabase
        .from('screenings')
        .select('*, movies(*), rooms(*)')
        .eq('id', screeningId)
        .single()

      if (!scr) return

      setScreening(scr)

      const { data: roomSeats } = await supabase
        .from('seats')
        .select('*')
        .eq('room_id', scr.room_id)
        .order('row_letter')
        .order('seat_number')

      setSeats(roomSeats ?? [])

      const { data: reservations } = await supabase
        .from('reservations')
        .select('seat_id')
        .eq('screening_id', screeningId)
        .in('status', ['confirmed', 'pending'])

      setReservedSeatIds(reservations?.map(r => r.seat_id) ?? [])

      const { data: pricing } = await supabase
        .from('pricing')
        .select('*')
        .order('multiplier', { ascending: false })

      setPricingOptions(pricing ?? [])
      if (pricing && pricing.length > 0) setSelectedPricing(pricing[0])

      setLoading(false)
    }

    load()
  }, [screeningId])

  const handleToggleSeat = (seat: Seat) => {
    setSelectedSeats(prev => {
      const exists = prev.find(s => s.id === seat.id)
      if (exists) {
        return prev.filter(s => s.id !== seat.id)
      }
      return [...prev, seat]
    })
  }

  const pricePerTicket = screening && selectedPricing
    ? Number(screening.base_price) * Number(selectedPricing.multiplier)
    : 0

  const totalPrice = (pricePerTicket * selectedSeats.length).toFixed(2)

  const handleBook = async () => {
    if (selectedSeats.length === 0 || !selectedPricing || !screening) return

    setBooking(true)
    setError(null)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/login')
      return
    }

    // Look up the customer row by email to get the correct customer_id
    const { data: customer } = await supabase
      .from('customers')
      .select('id')
      .eq('email', user.email)
      .single()

    const customerId = customer?.id ?? user.id

    const reservations = selectedSeats.map(seat => ({
      customer_id: customerId,
      screening_id: Number(screeningId),
      seat_id: seat.id,
      pricing_id: selectedPricing.id,
      amount_paid: pricePerTicket,
      status: 'confirmed',
    }))

    const { error: insertError } = await supabase
      .from('reservations')
      .insert(reservations)

    if (insertError) {
      setError(insertError.message)
      setBooking(false)
      return
    }

    setSuccess(true)
    setBooking(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (success) {
    const seatLabels = selectedSeats
      .sort((a, b) => a.row_letter.localeCompare(b.row_letter) || a.seat_number - b.seat_number)
      .map(s => `${s.row_letter}${s.seat_number}`)

    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="rounded-2xl bg-card border border-success/30 p-8">
          <div className="mx-auto w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mb-4">
            <CreditCard className="h-8 w-8 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Booking confirmed!</h1>
          <p className="mt-2 text-muted">
            {screening.movies.title}
          </p>
          <p className="mt-1 text-sm text-muted">
            {selectedSeats.length} seat{selectedSeats.length > 1 ? 's' : ''} — Seats {seatLabels.join(', ')}
          </p>
          <p className="mt-2 text-lg font-bold text-primary">{totalPrice} €</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => router.push('/account')}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              My Reservations
            </button>
            <button
              onClick={() => router.push('/')}
              className="rounded-lg bg-card border border-border px-6 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors"
            >
              Back to home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Seat Map */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold mb-6">Choose your seats</h1>

          <div className="rounded-2xl bg-card border border-border p-6 overflow-x-auto">
            <SeatMap
              seats={seats}
              reservedSeatIds={reservedSeatIds}
              selectedSeatIds={selectedSeats.map(s => s.id)}
              onToggle={handleToggleSeat}
            />
          </div>
        </div>

        {/* Booking Summary */}
        <div className="w-full lg:w-80">
          <div className="sticky top-24 rounded-2xl bg-card border border-border p-6 space-y-5">
            <h2 className="text-lg font-bold">Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-muted">
                <Film className="h-4 w-4 flex-shrink-0" />
                <span className="font-medium text-foreground">{screening.movies.title}</span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <Calendar className="h-4 w-4 flex-shrink-0" />
                <span>
                  {new Date(screening.start_time).toLocaleDateString('en-US', {
                    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <Clock className="h-4 w-4 flex-shrink-0" />
                <span>
                  {new Date(screening.start_time).toLocaleTimeString('en-US', {
                    hour: '2-digit', minute: '2-digit',
                  })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-muted">
                <MapPin className="h-4 w-4 flex-shrink-0" />
                <span>{screening.rooms.name}</span>
              </div>
            </div>

            {/* Selected seats */}
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted mb-2">
                Selected seats ({selectedSeats.length})
              </p>
              {selectedSeats.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedSeats
                    .sort((a, b) => a.row_letter.localeCompare(b.row_letter) || a.seat_number - b.seat_number)
                    .map(seat => (
                      <span
                        key={seat.id}
                        className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/30 px-2.5 py-1 text-sm font-medium text-blue-400"
                      >
                        {seat.row_letter}{seat.seat_number}
                        <button
                          onClick={() => handleToggleSeat(seat)}
                          className="ml-0.5 hover:text-blue-200 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                </div>
              ) : (
                <p className="text-sm text-muted italic">Click seats to select them</p>
              )}
            </div>

            {/* Pricing */}
            <div className="border-t border-border pt-4">
              <p className="text-sm text-muted mb-2">Pricing</p>
              <div className="space-y-2">
                {pricingOptions.map(p => (
                  <label
                    key={p.id}
                    className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-all ${
                      selectedPricing?.id === p.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="pricing"
                        checked={selectedPricing?.id === p.id}
                        onChange={() => setSelectedPricing(p)}
                        className="accent-primary"
                      />
                      <span className="text-sm">{p.label}</span>
                    </div>
                    <span className="text-sm text-muted">×{Number(p.multiplier).toFixed(2)}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between text-sm text-muted mb-1">
                <span>{selectedSeats.length} × {pricePerTicket.toFixed(2)} €</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted">Total</span>
                <span className="text-2xl font-bold text-primary">{totalPrice} €</span>
              </div>
            </div>

            {error && (
              <p className="text-sm text-danger">{error}</p>
            )}

            <button
              onClick={handleBook}
              disabled={selectedSeats.length === 0 || booking}
              className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-white hover:bg-primary-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {booking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                `Book ${selectedSeats.length} seat${selectedSeats.length > 1 ? 's' : ''}`
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
