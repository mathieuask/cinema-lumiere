'use client'

import type { Seat } from '@/lib/supabase/types'
import { Accessibility } from 'lucide-react'

interface SeatMapProps {
  seats: Seat[]
  reservedSeatIds: number[]
  selectedSeatIds: number[]
  onToggle: (seat: Seat) => void
}

export default function SeatMap({ seats, reservedSeatIds, selectedSeatIds, onToggle }: SeatMapProps) {
  const rows = [...new Set(seats.map(s => s.row_letter))].sort()
  const maxSeatsPerRow = Math.max(...rows.map(r => seats.filter(s => s.row_letter === r).length))
  const aisleAfter = Math.ceil(maxSeatsPerRow / 2)

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Screen */}
      <div className="w-full max-w-lg relative">
        <svg viewBox="0 0 400 30" className="w-full">
          <path d="M 30 25 Q 200 5 370 25" fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" />
        </svg>
        <p className="text-center text-xs text-muted -mt-1">SCREEN</p>
      </div>

      {/* Seats */}
      <div className="flex flex-col gap-1.5 mt-2">
        {rows.map(row => {
          const rowSeats = seats
            .filter(s => s.row_letter === row)
            .sort((a, b) => a.seat_number - b.seat_number)

          // Build fixed-width grid: each seat goes in its column position
          // Seats are numbered 1..N, we place them in a grid of maxSeatsPerRow columns
          const seatsByNumber: (Seat | null)[] = Array.from({ length: maxSeatsPerRow }, () => null)
          rowSeats.forEach(s => {
            seatsByNumber[s.seat_number - 1] = s
          })

          return (
            <div key={row} className="flex items-center gap-0">
              <span className="w-6 text-center text-xs font-medium text-muted flex-shrink-0">{row}</span>
              <div className="flex items-center gap-1">
                {seatsByNumber.map((seat, idx) => (
                  <div key={idx} className="flex items-center">
                    {/* Aisle gap after middle column */}
                    {idx === aisleAfter && <div className="w-5 flex-shrink-0" />}
                    {seat ? (
                      <SeatButton
                        seat={seat}
                        row={row}
                        isReserved={reservedSeatIds.includes(seat.id)}
                        isSelected={selectedSeatIds.includes(seat.id)}
                        onToggle={onToggle}
                      />
                    ) : (
                      <div className="w-7 h-7" />
                    )}
                  </div>
                ))}
              </div>
              <span className="w-6 text-center text-xs font-medium text-muted flex-shrink-0">{row}</span>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-5 mt-2 text-xs text-muted">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-card-hover border border-border" />
          Available
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-blue-500" />
          Selected
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-red-500/30" />
          Reserved
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-emerald-500/20 border border-emerald-500/30" />
          Accessible
        </div>
      </div>
    </div>
  )
}

function SeatButton({ seat, row, isReserved, isSelected, onToggle }: {
  seat: Seat
  row: string
  isReserved: boolean
  isSelected: boolean
  onToggle: (seat: Seat) => void
}) {
  const isPmr = seat.seat_type === 'pmr'

  let className = 'w-7 h-7 rounded-md flex items-center justify-center text-[9px] font-medium transition-all duration-150 '

  if (isReserved) {
    className += 'bg-red-500/30 text-red-400/50 cursor-not-allowed'
  } else if (isSelected) {
    className += 'bg-blue-500 text-white shadow-lg shadow-blue-500/30 seat-selected'
  } else if (isPmr) {
    className += 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 seat-available hover:bg-emerald-500/40'
  } else {
    className += 'bg-card-hover text-muted border border-border seat-available hover:bg-primary/20 hover:text-primary hover:border-primary/40'
  }

  return (
    <button
      disabled={isReserved}
      onClick={() => onToggle(seat)}
      className={className}
      title={`${row}${seat.seat_number} — ${seat.seat_type}`}
    >
      {isPmr ? <Accessibility className="h-3 w-3" /> : seat.seat_number}
    </button>
  )
}
