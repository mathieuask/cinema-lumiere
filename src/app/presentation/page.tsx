'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft, ChevronRight, Maximize, Minimize, Film,
  GraduationCap, ChevronDown, Check, MousePointer2,
  Clock, MapPin, Calendar, Star, CreditCard, Ticket, Smartphone,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { queries } from '@/lib/queries'

/* ═══════════════════════════════════════════════
   Hide footer + navbar on mount
   ═══════════════════════════════════════════════ */
function useHideChrome() {
  useEffect(() => {
    const nav = document.querySelector('nav')
    const footer = document.querySelector('footer')
    const main = document.querySelector('main')
    if (nav) nav.style.display = 'none'
    if (footer) footer.style.display = 'none'
    if (main) main.style.flex = 'unset'
    document.body.style.overflow = 'hidden'
    return () => {
      if (nav) nav.style.display = ''
      if (footer) footer.style.display = ''
      if (main) main.style.flex = ''
      document.body.style.overflow = ''
    }
  }, [])
}

/* ═══════════════════════════════════════════════
   SQL Syntax Highlighter
   ═══════════════════════════════════════════════ */
const KW = [
  'SELECT','FROM','WHERE','JOIN','LEFT JOIN','INNER JOIN',
  'ON','AND','OR','NOT','IN','AS','ORDER BY','GROUP BY','HAVING',
  'LIMIT','DISTINCT','COUNT','SUM','AVG','MAX','MIN','ROUND',
  'BETWEEN','EXTRACT','YEAR','MONTH','DATE','DESC','ASC','IS','NULL',
].sort((a, b) => b.length - a.length)

function Sql({ code, small }: { code: string; small?: boolean }) {
  function hl(line: string) {
    const p: { t: string; c: string }[] = []
    let r = line
    while (r.length > 0) {
      const s = r.match(/^'[^']*'/)
      if (s) { p.push({ t: s[0], c: '#ce9178' }); r = r.slice(s[0].length); continue }
      const n = r.match(/^\b\d+(\.\d+)?\b/)
      if (n) { p.push({ t: n[0], c: '#b5cea8' }); r = r.slice(n[0].length); continue }
      let ok = false
      for (const kw of KW) {
        const m = r.match(new RegExp(`^\\b${kw}\\b`, 'i'))
        if (m) { p.push({ t: m[0].toUpperCase(), c: '#569cd6' }); r = r.slice(m[0].length); ok = true; break }
      }
      if (ok) continue
      const last = p[p.length - 1]
      if (last?.c === '#ccc') last.t += r[0]; else p.push({ t: r[0], c: '#ccc' })
      r = r.slice(1)
    }
    return p
  }
  const lines = code.trim().split('\n')
  return (
    <pre style={{
      borderRadius: 12, background: '#0a0a12', border: '1px solid rgba(255,255,255,0.06)',
      padding: small ? 12 : 20, fontSize: small ? 11 : 14, lineHeight: 1.7,
      overflowX: 'auto', fontFamily: 'var(--font-geist-mono), monospace',
    }}>
      <code>{lines.map((l, i) => (
        <div key={i} style={{ display: 'flex' }}>
          <span style={{ width: 28, textAlign: 'right', marginRight: 12, color: 'rgba(255,255,255,0.15)', userSelect: 'none', flexShrink: 0 }}>{i + 1}</span>
          <span>{hl(l).map((x, j) => <span key={j} style={{ color: x.c }}>{x.t}</span>)}</span>
        </div>
      ))}</code>
    </pre>
  )
}

/* ═══════════════════════════════════════════════
   CDM — Conceptual Data Model (MERISE style)
   ═══════════════════════════════════════════════ */
function CdmSlide() {
  const W = 1100, H = 580
  const cardW = 180, headerH = 26, fieldH = 18, padBot = 8

  // ── Entity positions ──
  // 3 cols × 3 rows — row1 pushed down for "is a"/"contains" breathing room
  const col0 = 50, col1 = 420, col2 = 790
  const row0 = 10, row1 = 230, row2 = 400

  // Heights: Movies=142, Screenings=88, Rooms=88, Categories=70,
  //          Reservations=106, Seats=106, Customers=124, Pricing=88
  const entities = [
    { name: 'Movies',       x: col0, y: row0, attrs: ['idMovie', 'Title', 'Synopsis', 'DurationMin', 'ReleaseDate', 'Director'] },
    { name: 'Screenings',   x: col1, y: row0, attrs: ['idScreening', 'StartTime', 'BasePrice'] },
    { name: 'Rooms',        x: col2, y: row0, attrs: ['idRoom', 'Name', 'Capacity'] },
    { name: 'Categories',   x: col0, y: row1, attrs: ['idCategory', 'Name'] },
    { name: 'Reservations', x: col1, y: row1, attrs: ['idReservation', 'AmountPaid', 'ReservedAt', 'Status'] },
    { name: 'Seats',        x: col2, y: row1, attrs: ['idSeat', 'RowLetter', 'SeatNumber', 'SeatType'] },
    { name: 'Customers',    x: col1, y: row2, attrs: ['idCustomer', 'FirstName', 'LastName', 'Email', 'BirthDate'] },
    { name: 'Pricing',      x: col2, y: row2, attrs: ['idPricing', 'Label', 'Multiplier'] },
  ]

  function entH(e: typeof entities[0]) { return headerH + e.attrs.length * fieldH + padBot }

  function anchor(name: string, side: 'l' | 'r' | 't' | 'b', offset = 0) {
    const e = entities.find(en => en.name === name)!
    const h = entH(e)
    switch (side) {
      case 'l': return { x: e.x, y: e.y + h / 2 + offset }
      case 'r': return { x: e.x + cardW, y: e.y + h / 2 + offset }
      case 't': return { x: e.x + cardW / 2 + offset, y: e.y }
      case 'b': return { x: e.x + cardW / 2 + offset, y: e.y + h }
    }
  }

  // ── Association definitions ──
  // Computed midpoints:
  //   "is a":         Movies.b y=152 → Categories.t y=230, mid=191
  //   "projects":     Movies.r y=81  → Screenings.l y=54, mid≈68
  //   "takes place":  Screenings.r y=54 → Rooms.l y=54 (same height)
  //   "contains":     Rooms.b y=98  → Seats.t y=230, mid=164
  //   "reserves":     Reserv.l y=283 → Cust.l y=462, V-shape left
  //   "for seat":     Reserv.r y=263 → Seats.l y=263 (same height)
  //   "at price":     Reserv.r y=303 → Pricing.l y=444, diagonal
  const associations: {
    name: string; cx: number; cy: number; rx: number; ry: number
    conns: { entity: string; side: 'l' | 'r' | 't' | 'b'; card: string; anchorOffset?: number; labelDx?: number; labelDy?: number }[]
  }[] = [
    // Movies ↔ Categories — vertical col0, gap 152→230 = 78px
    { name: 'is a', cx: 140, cy: 191, rx: 38, ry: 18, conns: [
      { entity: 'Movies',     side: 'b', card: '0,n', labelDx: 24, labelDy: 4 },
      { entity: 'Categories', side: 't', card: '0,n', labelDx: 24, labelDy: -2 },
    ]},
    // Movies ↔ Screenings — horizontal row0
    { name: 'projects', cx: 310, cy: 68, rx: 42, ry: 18, conns: [
      { entity: 'Movies',     side: 'r', card: '0,n', labelDx: 0, labelDy: -10 },
      { entity: 'Screenings', side: 'l', card: '1,1', labelDx: 0, labelDy: -10 },
    ]},
    // Screenings ↔ Rooms — horizontal row0
    { name: 'takes place in', cx: 695, cy: 54, rx: 58, ry: 18, conns: [
      { entity: 'Screenings', side: 'r', card: '1,1', labelDx: 0, labelDy: -10 },
      { entity: 'Rooms',      side: 'l', card: '0,n', labelDx: 0, labelDy: -10 },
    ]},
    // Rooms ↔ Seats — vertical col2, gap 98→230 = 132px
    { name: 'contains', cx: 880, cy: 164, rx: 44, ry: 18, conns: [
      { entity: 'Rooms',  side: 'b', card: '1,n', labelDx: 24, labelDy: 4 },
      { entity: 'Seats',  side: 't', card: '1,1', labelDx: 24, labelDy: -2 },
    ]},
    // Customers ↔ Reservations — V-shape to the LEFT, clear separation
    { name: 'reserves', cx: 340, cy: 365, rx: 42, ry: 18, conns: [
      { entity: 'Reservations', side: 'l', card: '0,n', labelDx: -14, labelDy: -6 },
      { entity: 'Customers',    side: 'l', card: '0,n', labelDx: -14, labelDy: 6 },
    ]},
    // Reservations ↔ Seats — near-horizontal, offset -20
    { name: 'for seat', cx: 695, cy: 263, rx: 40, ry: 18, conns: [
      { entity: 'Reservations', side: 'r', anchorOffset: -20, card: '1,1', labelDx: 0, labelDy: -10 },
      { entity: 'Seats',        side: 'l', anchorOffset: -20, card: '0,n', labelDx: 0, labelDy: -10 },
    ]},
    // Reservations ↔ Pricing — diagonal down-right, offset +20
    { name: 'at price', cx: 695, cy: 375, rx: 40, ry: 18, conns: [
      { entity: 'Reservations', side: 'r', anchorOffset: 20, card: '1,1', labelDx: 8, labelDy: -8 },
      { entity: 'Pricing',      side: 'l', card: '0,n', labelDx: -8, labelDy: -8 },
    ]},
  ]

  // ── Helpers ──
  function ellipseEdge(cx: number, cy: number, rx: number, ry: number, tx: number, ty: number) {
    const angle = Math.atan2((ty - cy) / ry, (tx - cx) / rx)
    return { x: cx + rx * Math.cos(angle), y: cy + ry * Math.sin(angle) }
  }

  function cardLabel(ax: number, ay: number, bx: number, by: number, dx: number, dy: number) {
    const t = 0.22
    return { x: ax + (bx - ax) * t + dx, y: ay + (by - ay) * t + dy }
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#e50914', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Step 1</span>
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>CDM — Conceptual Data Model</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Entités, associations et cardinalités (méthode MERISE)</p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">

          {/* ── Lines + cardinalities ── */}
          {associations.map(assoc =>
            assoc.conns.map((conn, ci) => {
              const a = anchor(conn.entity, conn.side, conn.anchorOffset)
              const e = ellipseEdge(assoc.cx, assoc.cy, assoc.rx, assoc.ry, a.x, a.y)
              const lp = cardLabel(a.x, a.y, e.x, e.y, conn.labelDx ?? 0, conn.labelDy ?? 0)
              return (
                <g key={`${assoc.name}-${ci}`}>
                  <line x1={a.x} y1={a.y} x2={e.x} y2={e.y} stroke="#06b6d4" strokeWidth={1.3} />
                  <text x={lp.x} y={lp.y} textAnchor="middle" fill="#06b6d4" fontSize={11} fontWeight={700}>{conn.card}</text>
                </g>
              )
            })
          )}

          {/* ── Entities ── */}
          {entities.map(ent => {
            const h = entH(ent)
            return (
              <g key={ent.name}>
                <rect x={ent.x} y={ent.y} width={cardW} height={h} rx={4} fill="#2a2010" stroke="#f5c518" strokeWidth={1.5} />
                <rect x={ent.x} y={ent.y} width={cardW} height={headerH} rx={4} fill="#f5c518" />
                <rect x={ent.x} y={ent.y + headerH - 8} width={cardW} height={8} fill="#f5c518" />
                <text x={ent.x + cardW / 2} y={ent.y + 17} textAnchor="middle" fill="#1a1a1a" fontSize={13} fontWeight={700}>{ent.name}</text>
                {ent.attrs.map((a, i) => (
                  <text key={a} x={ent.x + 10} y={ent.y + headerH + 16 + i * fieldH}
                    fill={i === 0 ? '#f5c518' : 'rgba(255,255,255,0.5)'} fontSize={11}
                    fontFamily="var(--font-geist-mono), monospace"
                    textDecoration={i === 0 ? 'underline' : 'none'}>
                    {a}
                  </text>
                ))}
              </g>
            )
          })}

          {/* ── Associations ── */}
          {associations.map(a => (
            <g key={a.name}>
              <ellipse cx={a.cx} cy={a.cy} rx={a.rx} ry={a.ry} fill="#0e7490" stroke="#06b6d4" strokeWidth={1.5} />
              <text x={a.cx} y={a.cy + 4} textAnchor="middle" fill="white" fontSize={10} fontWeight={600}>{a.name}</text>
            </g>
          ))}

          {/* ── Legend ── */}
          <rect x={10} y={550} width={14} height={14} rx={2} fill="#f5c518" />
          <text x={30} y={562} fill="rgba(255,255,255,0.4)" fontSize={11}>Entité</text>
          <ellipse cx={107} cy={557} rx={12} ry={8} fill="#0e7490" stroke="#06b6d4" strokeWidth={1} />
          <text x={125} y={562} fill="rgba(255,255,255,0.4)" fontSize={11}>Association</text>
          <text x={220} y={562} fill="#06b6d4" fontSize={11} fontWeight={700}>0,n</text>
          <text x={248} y={562} fill="rgba(255,255,255,0.4)" fontSize={11}>Cardinalité</text>
          <text x={340} y={562} fill="rgba(255,255,255,0.4)" fontSize={11}>8 entités · 7 associations</text>
        </svg>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   LDM — Logical Data Model (grey blocks + FK arrows)
   ═══════════════════════════════════════════════ */
function LdmSlide() {
  const W = 1100, H = 540
  const cardW = 160, headerH = 22, fieldH = 15, padBot = 6

  const tables = [
    { name: 'Movies', x: 30, y: 30, fields: [
      { n: 'idMovie', k: 'pk' }, { n: 'Title', k: '' }, { n: 'Synopsis', k: '' },
      { n: 'DurationMin', k: '' }, { n: 'ReleaseDate', k: '' }, { n: 'Director', k: '' },
    ]},
    { name: 'Screenings', x: 430, y: 30, fields: [
      { n: 'idScreening', k: 'pk' }, { n: 'StartTime', k: '' }, { n: 'BasePrice', k: '' },
      { n: '#idMovie', k: 'fk' }, { n: '#idRoom', k: 'fk' },
    ]},
    { name: 'Rooms', x: 810, y: 30, fields: [
      { n: 'idRoom', k: 'pk' }, { n: 'Name', k: '' }, { n: 'Capacity', k: '' },
    ]},
    { name: 'movie_categories', x: 30, y: 200, fields: [
      { n: '#idMovie', k: 'pkfk' }, { n: '#idCategory', k: 'pkfk' },
    ]},
    { name: 'Reservations', x: 430, y: 200, fields: [
      { n: 'idReservation', k: 'pk' }, { n: 'AmountPaid', k: '' }, { n: 'ReservedAt', k: '' },
      { n: 'Status', k: '' }, { n: '#idCustomer', k: 'fk' }, { n: '#idScreening', k: 'fk' },
      { n: '#idSeat', k: 'fk' }, { n: '#idPricing', k: 'fk' },
    ]},
    { name: 'Seats', x: 810, y: 200, fields: [
      { n: 'idSeat', k: 'pk' }, { n: 'RowLetter', k: '' }, { n: 'SeatNumber', k: '' },
      { n: 'SeatType', k: '' }, { n: '#idRoom', k: 'fk' },
    ]},
    { name: 'Categories', x: 30, y: 385, fields: [
      { n: 'idCategory', k: 'pk' }, { n: 'Name', k: '' },
    ]},
    { name: 'Customers', x: 430, y: 385, fields: [
      { n: 'idCustomer', k: 'pk' }, { n: 'FirstName', k: '' }, { n: 'LastName', k: '' },
      { n: 'Email', k: '' }, { n: 'BirthDate', k: '' },
    ]},
    { name: 'Pricing', x: 810, y: 385, fields: [
      { n: 'idPricing', k: 'pk' }, { n: 'Label', k: '' }, { n: 'Multiplier', k: '' },
    ]},
  ]

  function tH(t: typeof tables[0]) { return headerH + t.fields.length * fieldH + padBot }

  function anc(name: string, side: 'l' | 'r' | 't' | 'b', off = 0) {
    const t = tables.find(tb => tb.name === name)!
    const h = tH(t)
    switch (side) {
      case 'l': return { x: t.x, y: t.y + h / 2 + off }
      case 'r': return { x: t.x + cardW, y: t.y + h / 2 + off }
      case 't': return { x: t.x + cardW / 2 + off, y: t.y }
      case 'b': return { x: t.x + cardW / 2 + off, y: t.y + h }
    }
  }

  // FK arrows: from table with FK → to table with PK
  const arrows: { from: string; fS: 'l'|'r'|'t'|'b'; to: string; tS: 'l'|'r'|'t'|'b'; fOff?: number; tOff?: number }[] = [
    { from: 'Screenings', fS: 'l', to: 'Movies', tS: 'r' },
    { from: 'Screenings', fS: 'r', to: 'Rooms', tS: 'l' },
    { from: 'Seats', fS: 't', to: 'Rooms', tS: 'b' },
    { from: 'movie_categories', fS: 't', to: 'Movies', tS: 'b' },
    { from: 'movie_categories', fS: 'b', to: 'Categories', tS: 't' },
    { from: 'Reservations', fS: 't', to: 'Screenings', tS: 'b' },
    { from: 'Reservations', fS: 'b', to: 'Customers', tS: 't' },
    { from: 'Reservations', fS: 'r', to: 'Seats', tS: 'l', fOff: -22 },
    { from: 'Reservations', fS: 'r', to: 'Pricing', tS: 'l', fOff: 22 },
  ]

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#e50914', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Step 2</span>
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>LDM — Logical Data Model</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>Application des règles de conversion CDM → LDM</p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="fk-arrow" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="7" markerHeight="6" orient="auto">
              <path d="M 0 0.5 L 9 4 L 0 7.5 Z" fill="#3b82f6" opacity="0.7" />
            </marker>
          </defs>

          {/* ── FK Arrows ── */}
          {arrows.map((a, i) => {
            const f = anc(a.from, a.fS, a.fOff)
            const t = anc(a.to, a.tS, a.tOff)
            return <line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y} stroke="#3b82f6" strokeWidth={1.2} strokeOpacity={0.5} markerEnd="url(#fk-arrow)" />
          })}

          {/* ── Table blocks ── */}
          {tables.map(tb => {
            const h = tH(tb)
            return (
              <g key={tb.name}>
                {/* Card background */}
                <rect x={tb.x} y={tb.y} width={cardW} height={h} rx={3} fill="#28283a" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
                {/* Header */}
                <rect x={tb.x} y={tb.y} width={cardW} height={headerH} rx={3} fill="#3a3a50" />
                <rect x={tb.x} y={tb.y + headerH - 6} width={cardW} height={6} fill="#3a3a50" />
                <text x={tb.x + cardW / 2} y={tb.y + 15} textAnchor="middle" fill="rgba(255,255,255,0.85)" fontSize={11} fontWeight={700}>{tb.name}</text>
                {/* Fields */}
                {tb.fields.map((f, j) => {
                  const fy = tb.y + headerH + 12 + j * fieldH
                  const isPk = f.k === 'pk' || f.k === 'pkfk'
                  const isFk = f.k === 'fk' || f.k === 'pkfk'
                  return (
                    <text key={f.n} x={tb.x + 8} y={fy}
                      fill={isFk ? '#3b82f6' : isPk ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'}
                      fontSize={10}
                      fontWeight={isPk ? 700 : 400}
                      fontStyle={isFk ? 'italic' : 'normal'}
                      textDecoration={isPk ? 'underline' : 'none'}
                      fontFamily="var(--font-geist-mono), monospace">
                      {f.n}
                    </text>
                  )
                })}
              </g>
            )
          })}

          {/* ── Legend ── */}
          <rect x={10} y={510} width={14} height={14} rx={2} fill="#3a3a50" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
          <text x={30} y={522} fill="rgba(255,255,255,0.4)" fontSize={11}>Table</text>
          <text x={80} y={522} fill="rgba(255,255,255,0.8)" fontSize={11} fontWeight={700} textDecoration="underline" fontFamily="var(--font-geist-mono), monospace">PK</text>
          <text x={108} y={522} fill="rgba(255,255,255,0.4)" fontSize={11}>Clé primaire</text>
          <text x={200} y={522} fill="#3b82f6" fontSize={11} fontStyle="italic" fontFamily="var(--font-geist-mono), monospace">#FK</text>
          <text x={228} y={522} fill="rgba(255,255,255,0.4)" fontSize={11}>Clé étrangère</text>
          <line x1={330} y1={517} x2={370} y2={517} stroke="#3b82f6" strokeWidth={1.2} strokeOpacity={0.5} markerEnd="url(#fk-arrow)" />
          <text x={380} y={522} fill="rgba(255,255,255,0.4)" fontSize={11}>Référence FK</text>
          <text x={490} y={522} fill="rgba(255,255,255,0.4)" fontSize={11}>9 tables · 9 relations FK</text>
        </svg>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Database Schema — Pure SVG with curved lines
   ═══════════════════════════════════════════════ */
function SchemaSlide() {
  // All in SVG coordinates
  const W = 1100, H = 580
  const cardW = 240, headerH = 28, fieldH = 22

  const TC: Record<string, string> = {
    movies: '#e50914', rooms: '#f5c518', screenings: '#3b82f6', customers: '#22c55e',
    reservations: '#a855f7', pricing: '#f97316', categories: '#06b6d4', movie_categories: '#ec4899',
  }

  // Layout: 3 columns, 3 rows — no line crossings
  // Row 0: movies, screenings, rooms
  // Row 1: movie_categories, reservations, pricing
  // Row 2: categories, customers
  const col0 = 30, col1 = 430, col2 = 830
  const row0 = 20, row1 = 210, row2 = 420

  const tables = [
    { name: 'movies', x: col0, y: row0, fields: [{ n: 'id', t: 'uuid', k: 'pk' }, { n: 'title', t: 'text', k: '' }, { n: 'director', t: 'text', k: '' }, { n: 'release_date', t: 'date', k: '' }] },
    { name: 'screenings', x: col1, y: row0, fields: [{ n: 'id', t: 'uuid', k: 'pk' }, { n: 'start_time', t: 'timestamptz', k: '' }, { n: 'movie_id', t: 'uuid', k: 'fk' }, { n: 'room_id', t: 'uuid', k: 'fk' }] },
    { name: 'rooms', x: col2, y: row0, fields: [{ n: 'id', t: 'uuid', k: 'pk' }, { n: 'name', t: 'text', k: '' }, { n: 'capacity', t: 'int4', k: '' }] },
    { name: 'movie_categories', x: col0, y: row1, fields: [{ n: 'movie_id', t: 'uuid', k: 'fk' }, { n: 'category_id', t: 'uuid', k: 'fk' }] },
    { name: 'reservations', x: col1, y: row1, fields: [{ n: 'id', t: 'uuid', k: 'pk' }, { n: 'customer_id', t: 'uuid', k: 'fk' }, { n: 'screening_id', t: 'uuid', k: 'fk' }, { n: 'pricing_id', t: 'uuid', k: 'fk' }, { n: 'status', t: 'text', k: '' }, { n: 'amount_paid', t: 'numeric', k: '' }] },
    { name: 'pricing', x: col2, y: row1, fields: [{ n: 'id', t: 'uuid', k: 'pk' }, { n: 'label', t: 'text', k: '' }] },
    { name: 'categories', x: col0, y: row2, fields: [{ n: 'id', t: 'uuid', k: 'pk' }, { n: 'name', t: 'text', k: '' }] },
    { name: 'customers', x: col1, y: row2, fields: [{ n: 'id', t: 'uuid', k: 'pk' }, { n: 'first_name', t: 'text', k: '' }, { n: 'last_name', t: 'text', k: '' }] },
  ]

  function cardH(nFields: number) { return headerH + nFields * fieldH + 4 }

  function anchor(name: string, side: 'l' | 'r' | 't' | 'b') {
    const tb = tables.find(t => t.name === name)!
    const h = cardH(tb.fields.length)
    switch (side) {
      case 'l': return { x: tb.x, y: tb.y + h / 2 }
      case 'r': return { x: tb.x + cardW, y: tb.y + h / 2 }
      case 't': return { x: tb.x + cardW / 2, y: tb.y }
      case 'b': return { x: tb.x + cardW / 2, y: tb.y + h }
    }
  }

  const relations: { from: string; fS: 'l' | 'r' | 't' | 'b'; to: string; tS: 'l' | 'r' | 't' | 'b'; label: string }[] = [
    { from: 'movies', fS: 'r', to: 'screenings', tS: 'l', label: '1:N' },       // horizontal row 0
    { from: 'rooms', fS: 'l', to: 'screenings', tS: 'r', label: '1:N' },        // horizontal row 0
    { from: 'screenings', fS: 'b', to: 'reservations', tS: 't', label: '1:N' }, // vertical col 1
    { from: 'movies', fS: 'b', to: 'movie_categories', tS: 't', label: 'N:M' }, // vertical col 0
    { from: 'categories', fS: 't', to: 'movie_categories', tS: 'b', label: 'N:M' }, // vertical col 0
    { from: 'customers', fS: 't', to: 'reservations', tS: 'b', label: '1:N' },  // vertical col 1
    { from: 'pricing', fS: 'l', to: 'reservations', tS: 'r', label: '1:N' },    // horizontal row 1
  ]

  function curvePath(f: { x: number; y: number }, t: { x: number; y: number }, fS: string, tS: string) {
    const off = 60
    let c1x = f.x, c1y = f.y, c2x = t.x, c2y = t.y
    if (fS === 'r') c1x += off; else if (fS === 'l') c1x -= off
    else if (fS === 'b') c1y += off; else if (fS === 't') c1y -= off
    if (tS === 'l') c2x -= off; else if (tS === 'r') c2x += off
    else if (tS === 't') c2y -= off; else if (tS === 'b') c2y += off
    return `M ${f.x} ${f.y} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${t.x} ${t.y}`
  }

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Relational Model</h2>
      <div style={{ display: 'flex', gap: 20, marginBottom: 12, fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5c518' }} /> Clé primaire</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6' }} /> Clé étrangère</span>
        <span style={{ marginLeft: 'auto' }}>8 tables · 7 relations</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
          <defs>
            <marker id="dot" viewBox="0 0 8 8" refX="4" refY="4" markerWidth="6" markerHeight="6">
              <circle cx="4" cy="4" r="3" fill="#e50914" />
            </marker>
            <marker id="arw" viewBox="0 0 10 8" refX="9" refY="4" markerWidth="8" markerHeight="7" orient="auto">
              <path d="M 0 0.5 L 9 4 L 0 7.5 Z" fill="#e50914" opacity="0.8" />
            </marker>
          </defs>

          {/* Relation curves */}
          {relations.map((rel, i) => {
            const f = anchor(rel.from, rel.fS)
            const t = anchor(rel.to, rel.tS)
            const path = curvePath(f, t, rel.fS, rel.tS)
            const mx = (f.x + t.x) / 2, my = (f.y + t.y) / 2
            return (
              <g key={i}>
                <path d={path} fill="none" stroke="#e50914" strokeWidth="2" strokeOpacity="0.4" markerStart="url(#dot)" markerEnd="url(#arw)" />
                <rect x={mx - 18} y={my - 10} width="36" height="20" rx="5" fill="#0c0c14" stroke="#e50914" strokeWidth="1" strokeOpacity="0.5" />
                <text x={mx} y={my + 5} textAnchor="middle" fill="#e50914" fontSize="11" fontWeight="700">{rel.label}</text>
              </g>
            )
          })}

          {/* Table cards */}
          {tables.map(tb => {
            const h = cardH(tb.fields.length)
            const color = TC[tb.name]
            return (
              <g key={tb.name}>
                {/* Card bg */}
                <rect x={tb.x} y={tb.y} width={cardW} height={h} rx="8" fill="#0e0e18" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
                {/* Header */}
                <rect x={tb.x} y={tb.y} width={cardW} height={headerH} rx="8" fill={color + '20'} />
                <rect x={tb.x} y={tb.y + headerH - 8} width={cardW} height={8} fill={color + '20'} />
                <circle cx={tb.x + 14} cy={tb.y + headerH / 2} r="4" fill={color} />
                <text x={tb.x + 24} y={tb.y + headerH / 2 + 5} fill={color} fontSize="13" fontWeight="700" fontFamily="var(--font-geist-mono), monospace">{tb.name}</text>
                {/* Fields */}
                {tb.fields.map((f, j) => {
                  const fy = tb.y + headerH + j * fieldH + 16
                  return (
                    <g key={f.n}>
                      {f.k === 'pk' && (
                        <>
                          <rect x={tb.x + 10} y={fy - 10} width="20" height="14" rx="3" fill="rgba(245,197,24,0.12)" />
                          <text x={tb.x + 20} y={fy} textAnchor="middle" fill="#f5c518" fontSize="8" fontWeight="800">PK</text>
                        </>
                      )}
                      {f.k === 'fk' && (
                        <>
                          <rect x={tb.x + 10} y={fy - 10} width="18" height="14" rx="3" fill="rgba(59,130,246,0.12)" />
                          <text x={tb.x + 19} y={fy} textAnchor="middle" fill="#3b82f6" fontSize="8" fontWeight="800">FK</text>
                        </>
                      )}
                      <text x={tb.x + (f.k ? 36 : 14)} y={fy} fill="rgba(255,255,255,0.65)" fontSize="12" fontFamily="var(--font-geist-mono), monospace">{f.n}</text>
                      <text x={tb.x + cardW - 10} y={fy} textAnchor="end" fill="rgba(255,255,255,0.2)" fontSize="10" fontFamily="var(--font-geist-mono), monospace">{f.t}</text>
                    </g>
                  )
                })}
              </g>
            )
          })}
        </svg>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Realistic App Demo — precise cursor, seat-by-seat
   ═══════════════════════════════════════════════ */
const MOVIES = [
  { title: 'Inception', dir: 'C. Nolan', genre: 'Sci-Fi', color: '#8b5cf6', dur: 148, yr: 2010 },
  { title: 'The Godfather', dir: 'F. Coppola', genre: 'Drame', color: '#3b82f6', dur: 175, yr: 1972 },
  { title: 'Avatar 2', dir: 'J. Cameron', genre: 'Action', color: '#22c55e', dur: 192, yr: 2022 },
  { title: 'Interstellar', dir: 'C. Nolan', genre: 'Sci-Fi', color: '#f97316', dur: 169, yr: 2014 },
  { title: 'Gladiator', dir: 'R. Scott', genre: 'Historique', color: '#ef4444', dur: 155, yr: 2000 },
  { title: 'Amélie', dir: 'J-P. Jeunet', genre: 'Comédie', color: '#eab308', dur: 122, yr: 2001 },
]
const GC: Record<string, string> = { 'Sci-Fi': '#8b5cf6', Drame: '#3b82f6', Action: '#ef4444', Historique: '#f59e0b', Comédie: '#eab308' }

// Steps:
// 0: hidden | 1: cursor appears center | 2: cursor→Avatar2 | 3: click→booking
// 4: cursor→seat C5 | 5: click C5, cursor→C6 | 6: click C6, cursor→Réserver
// 7: click Réserver→confirm | 8: pause on confirm
// 9: cursor→"Mes réservations" | 10: click→account page | 11: pause on account
function AppDemo({ active }: { active: boolean }) {
  const [step, setStep] = useState(0)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])
  const screenRef = useRef<HTMLDivElement>(null)

  const run = useCallback(() => {
    timers.current.forEach(clearTimeout); timers.current = []; setStep(0)
    const delays = [800, 2500, 3800, 5500, 6800, 8000, 9500, 11500, 13000, 14500]
    delays.forEach((ms, i) => timers.current.push(setTimeout(() => setStep(i + 1), ms)))
    timers.current.push(setTimeout(run, 18000))
  }, [])

  useEffect(() => { if (active) run(); return () => timers.current.forEach(clearTimeout) }, [active, run])

  const page = step <= 2 ? 'catalog' : step <= 6 ? 'booking' : step <= 9 ? 'confirm' : 'account'
  const isClick = step === 3 || step === 5 || step === 6 || step === 7 || step === 10

  // Cursor positions in px relative to screen div (1100 x 550)
  // Avatar2 = 3rd card → center ~42% x, ~45% y
  // Seat C5: left panel (~40% width), row C (3rd of 5), seat 5 (1st after aisle)
  // Seat C6: next to C5
  // Réserver button: right panel ~85% x, ~80% y
  const cursorMap: Record<number, { x: number; y: number }> = {
    0: { x: -30, y: -30 },
    1: { x: 500, y: 280 },   // center
    2: { x: 400, y: 230 },   // Avatar 2 card center
    3: { x: 400, y: 230 },   // click on Avatar 2
    4: { x: 350, y: 290 },   // seat C5
    5: { x: 374, y: 290 },   // seat C6
    6: { x: 930, y: 410 },   // Réserver button
    7: { x: 930, y: 410 },   // click Réserver
    8: { x: -30, y: -30 },   // hidden on confirm
    9: { x: 460, y: 430 },   // "Mes réservations" button
    10: { x: 460, y: 430 },  // click
    11: { x: -30, y: -30 },  // hidden on account
  }
  const cur = cursorMap[Math.min(step, 11)] || { x: -30, y: -30 }

  const seatRows = ['A', 'B', 'C', 'D', 'E', 'F']
  const reserved = ['A3', 'A4', 'B6', 'C2', 'C3', 'D7', 'E1', 'F4', 'F5']
  const selected = step >= 5 ? (step >= 6 ? ['C5', 'C6'] : ['C5']) : []

  return (
    <div style={{ width: '100%', maxWidth: 1100, margin: '0 auto' }}>
      {/* Browser chrome */}
      <div style={{ borderRadius: '12px 12px 0 0', background: '#181824', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
        </div>
        <div style={{ flex: 1, margin: '0 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>
          cinema-sage-kappa.vercel.app{page === 'booking' ? '/booking/42' : page === 'confirm' ? '/booking/done' : page === 'account' ? '/account' : '/'}
        </div>
      </div>

      {/* Screen */}
      <div ref={screenRef} style={{ position: 'relative', borderRadius: '0 0 12px 12px', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', overflow: 'hidden', background: '#0a0a0f', height: 550 }}>
        {/* Navbar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Film style={{ width: 16, height: 16, color: '#e50914' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#e50914' }}>Cinema Lumière</span>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)', alignItems: 'center' }}>
            <span>Connexion</span>
            <span style={{ padding: '3px 10px', borderRadius: 6, background: '#e50914', color: 'white', fontSize: 10, fontWeight: 600 }}>Inscription</span>
          </div>
        </div>

        {/* ─── CATALOG ─── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 38, bottom: 0, padding: 20,
          opacity: page === 'catalog' ? 1 : 0, transform: page === 'catalog' ? 'none' : 'translateX(-40px)',
          transition: 'all 0.7s ease', pointerEvents: page === 'catalog' ? 'auto' : 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Film style={{ width: 14, height: 14, color: '#e50914' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>À l&apos;affiche</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
            {MOVIES.map((m, i) => (
              <div key={m.title} style={{
                borderRadius: 10, overflow: 'hidden',
                border: step >= 2 && i === 2 ? '2px solid rgba(229,9,20,0.6)' : '1px solid rgba(255,255,255,0.05)',
                boxShadow: step >= 2 && i === 2 ? '0 0 30px rgba(229,9,20,0.2)' : 'none',
                transform: step >= 2 && i === 2 ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.5s ease',
              }}>
                <div style={{ aspectRatio: '2/3', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${m.color}40, ${m.color}10)` }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Star style={{ width: 28, height: 28, color: `${m.color}50` }} />
                  </div>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 60%)' }} />
                  <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{m.title}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{m.dir}</p>
                  </div>
                </div>
                <div style={{ padding: 8, background: '#12121a' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>
                    <Clock style={{ width: 10, height: 10 }} />{m.dur} min<span style={{ marginLeft: 'auto' }}>{m.yr}</span>
                  </div>
                  <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 600, background: `${m.color}20`, color: m.color }}>{m.genre}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── BOOKING ─── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 38, bottom: 0,
          opacity: page === 'booking' ? 1 : 0, transform: page === 'booking' ? 'none' : 'translateX(40px)',
          transition: 'all 0.7s ease', pointerEvents: page === 'booking' ? 'auto' : 'none',
        }}>
          <div style={{ display: 'flex', height: '100%' }}>
            {/* Left: seats */}
            <div style={{ flex: 1, padding: 20 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>Choisissez vos places</h3>
              <div style={{ borderRadius: 14, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 20 }}>
                {/* Screen curve */}
                <svg viewBox="0 0 300 20" style={{ width: '70%', margin: '0 auto 8px', display: 'block' }}>
                  <path d="M 20 16 Q 150 2 280 16" fill="none" stroke="#e50914" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 16, letterSpacing: '0.15em' }}>ÉCRAN</p>
                {/* Seat grid */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                  {seatRows.map(row => (
                    <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 18, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: 600 }}>{row}</span>
                      {Array.from({ length: 8 }, (_, j) => {
                        const sid = `${row}${j + 1}`
                        const isR = reserved.includes(sid), isS = selected.includes(sid)
                        return (
                          <div key={j} style={{ display: 'flex', alignItems: 'center' }}>
                            {j === 4 && <div style={{ width: 16 }} />}
                            <div style={{
                              width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 600, transition: 'all 0.3s',
                              background: isS ? '#3b82f6' : isR ? 'rgba(239,68,68,0.25)' : '#1a1a2e',
                              color: isS ? 'white' : isR ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.3)',
                              border: `1.5px solid ${isS ? '#3b82f6' : isR ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`,
                              boxShadow: isS ? '0 0 12px rgba(59,130,246,0.4)' : 'none',
                            }}>{j + 1}</div>
                          </div>
                        )
                      })}
                      <span style={{ width: 18, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: 600 }}>{row}</span>
                    </div>
                  ))}
                </div>
                {/* Legend */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.07)' }} /> Disponible</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#3b82f6' }} /> Sélectionné</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(239,68,68,0.25)' }} /> Réservé</span>
                </div>
              </div>
            </div>
            {/* Right: summary */}
            <div style={{ width: 240, padding: 20, borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
              <h4 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>Résumé</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)' }}><Film style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)' }} /> Avatar 2</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)' }}><Calendar style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }} /> March 15, 2024</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)' }}><Clock style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }} /> 20:00</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)' }}><MapPin style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }} /> Room 1</div>
              </div>
              {selected.length > 0 && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Places sélectionnées ({selected.length})</p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {selected.map(s => <span key={s} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 11, fontWeight: 600 }}>{s}</span>)}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{selected.length} × 12.00 €</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Total</span>
                  <span style={{ fontSize: 20, fontWeight: 700, color: '#e50914' }}>{(selected.length * 12).toFixed(2)} €</span>
                </div>
              </div>
              <button style={{
                width: '100%', marginTop: 16, padding: '10px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600,
                background: step >= 6 ? '#e50914' : 'rgba(229,9,20,0.4)', color: 'white', cursor: 'pointer',
                boxShadow: step >= 6 ? '0 0 20px rgba(229,9,20,0.3)' : 'none',
                transform: step >= 6 ? 'scale(1.04)' : 'scale(1)', transition: 'all 0.4s',
              }}>Réserver {selected.length || '—'} place(s)</button>
            </div>
          </div>
        </div>

        {/* ─── CONFIRMATION ─── */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: 38, bottom: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: page === 'confirm' ? 1 : 0, transform: page === 'confirm' ? 'scale(1)' : 'scale(0.9)', transition: 'all 0.7s',
        }}>
          <div style={{ textAlign: 'center', padding: 32, borderRadius: 20, background: '#12121a', border: '1px solid rgba(34,197,94,0.25)', maxWidth: 320 }}>
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Check style={{ width: 28, height: 28, color: '#4ade80' }} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 6 }}>Réservation confirmée !</h3>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Avatar 2 · Room 1 · 20:00</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>2 places — C5, C6</p>
            <p style={{ fontSize: 24, fontWeight: 700, color: '#e50914' }}>24.00 €</p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
              <span style={{ padding: '6px 16px', borderRadius: 8, background: '#e50914', color: 'white', fontSize: 12, fontWeight: 600 }}>Mes réservations</span>
              <span style={{ padding: '6px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Accueil</span>
            </div>
          </div>
        </div>

        {/* ─── Cursor ─── */}
        {step >= 1 && step <= 7 && (
          <div style={{
            position: 'absolute', left: cur.x, top: cur.y, zIndex: 30,
            pointerEvents: 'none', transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)',
          }}>
            <MousePointer2 style={{
              width: 20, height: 20, color: 'white',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',
              transform: isClick ? 'scale(0.75)' : 'scale(1)',
              transition: 'transform 0.12s',
            }} />
            {isClick && <span style={{ position: 'absolute', top: -4, left: -4, width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', animation: 'ping 0.6s ease-out' }} />}
          </div>
        )}
      </div>

      {/* Flow labels */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 16 }}>
        {[
          { label: 'Catalogue', icon: <Film style={{ width: 14, height: 14 }} />, active: page === 'catalog' },
          { label: 'Réservation', icon: <Ticket style={{ width: 14, height: 14 }} />, active: page === 'booking' },
          { label: 'Confirmation', icon: <Check style={{ width: 14, height: 14 }} />, active: page === 'confirm' },
        ].map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {i > 0 && <ChevronRight style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.1)', marginRight: 4 }} />}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: s.active ? '#e50914' : 'rgba(255,255,255,0.2)', transition: 'color 0.3s', fontWeight: s.active ? 600 : 400 }}>
              {s.icon}{s.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Mes Reservations Demo
   ═══════════════════════════════════════════════ */
function ReservationsDemo({ active }: { active: boolean }) {
  const [step, setStep] = useState(0)
  const tmr = useRef<ReturnType<typeof setTimeout>[]>([])
  const run = useCallback(() => {
    tmr.current.forEach(clearTimeout); tmr.current = []; setStep(0)
    ;[800,2500,4000,6000,8000,10000].forEach((ms,i) => tmr.current.push(setTimeout(() => setStep(i+1), ms)))
    tmr.current.push(setTimeout(run, 13000))
  }, [])
  useEffect(() => { if (active) run(); return () => tmr.current.forEach(clearTimeout) }, [active, run])
  const showList = step >= 2, showCancel = step >= 4, cancelled = step >= 5
  const resv = [
    { film:'Avatar 2', date:'March 15, 2024', time:'20:00', room:'Room 1', seat:'C5', price:'12.00' },
    { film:'Avatar 2', date:'March 15, 2024', time:'20:00', room:'Room 1', seat:'C6', price:'12.00' },
    { film:'Inception', date:'March 10, 2024', time:'14:30', room:'Room 3', seat:'E8', price:'9.50' },
    { film:'The Godfather', date:'March 5, 2024', time:'21:00', room:'Room 2', seat:'B3', price:'14.00' },
  ]
  const cur: Record<number,{x:number;y:number}> = { 0:{x:-30,y:-30},1:{x:200,y:120},2:{x:200,y:160},3:{x:200,y:160},4:{x:920,y:355},5:{x:920,y:355},6:{x:-30,y:-30} }
  const c = cur[Math.min(step,6)]||{x:-30,y:-30}
  const isClick = step===3||step===5
  return (
    <div style={{ width:'100%', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ borderRadius:'12px 12px 0 0', background:'#181824', border:'1px solid rgba(255,255,255,0.08)', borderBottom:'none', padding:'8px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ display:'flex', gap:6 }}><span style={{ width:10,height:10,borderRadius:'50%',background:'#ff5f57' }}/><span style={{ width:10,height:10,borderRadius:'50%',background:'#febc2e' }}/><span style={{ width:10,height:10,borderRadius:'50%',background:'#28c840' }}/></div>
        <div style={{ flex:1, margin:'0 12px', borderRadius:6, background:'rgba(255,255,255,0.05)', padding:'4px 12px', fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>cinema-sage-kappa.vercel.app/account</div>
      </div>
      <div style={{ position:'relative', borderRadius:'0 0 12px 12px', border:'1px solid rgba(255,255,255,0.08)', borderTop:'none', overflow:'hidden', background:'#0a0a0f', height:480 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><Film style={{ width:16,height:16,color:'#e50914' }}/><span style={{ fontSize:13,fontWeight:700,color:'#e50914' }}>Cinema Lumière</span></div>
          <div style={{ display:'flex', gap:16, fontSize:11, color:'rgba(255,255,255,0.3)' }}><span>Films</span><span style={{ color:'#e50914',fontWeight:600 }}>Mon compte</span></div>
        </div>
        <div style={{ padding:20 }}>
          <div style={{ borderRadius:12, background:'#12121a', border:'1px solid rgba(255,255,255,0.06)', padding:16, display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
            <div style={{ width:48,height:48,borderRadius:'50%',background:'rgba(229,9,20,0.2)',display:'flex',alignItems:'center',justifyContent:'center' }}><span style={{ fontSize:20,color:'#e50914' }}>M</span></div>
            <div><p style={{ fontSize:16,fontWeight:700,color:'rgba(255,255,255,0.85)' }}>Marie Dupont</p><p style={{ fontSize:12,color:'rgba(255,255,255,0.3)' }}>marie.dupont@email.com</p></div>
          </div>
          <div style={{ borderRadius:12, background:'#12121a', border:`1px solid ${step>=2?'rgba(229,9,20,0.3)':'rgba(255,255,255,0.06)'}`, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:showList?12:0, transition:'all 0.3s' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><Ticket style={{ width:16,height:16,color:'#e50914' }}/><span style={{ fontSize:14,fontWeight:600,color:'rgba(255,255,255,0.7)' }}>Mes réservations (4)</span></div>
            <ChevronDown style={{ width:16,height:16,color:'rgba(255,255,255,0.3)',transform:showList?'rotate(180deg)':'none',transition:'transform 0.3s' }}/>
          </div>
          {showList && <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {resv.map((r,i) => { const isCx = i===3&&cancelled; return (
              <div key={i} style={{ borderRadius:10, background:'#12121a', border:`1px solid ${isCx?'rgba(239,68,68,0.2)':'rgba(255,255,255,0.06)'}`, padding:'10px 14px', display:'flex', alignItems:'center', justifyContent:'space-between', opacity:isCx?0.5:1, transition:'all 0.5s' }}>
                <div>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}><Film style={{ width:12,height:12,color:isCx?'rgba(255,255,255,0.3)':'#e50914' }}/><span style={{ fontSize:13,fontWeight:600,color:'rgba(255,255,255,0.8)' }}>{r.film}</span>{isCx&&<span style={{ fontSize:9,padding:'1px 6px',borderRadius:10,background:'rgba(239,68,68,0.2)',color:'#ef4444' }}>Cancelled</span>}</div>
                  <div style={{ display:'flex', gap:12, fontSize:11, color:'rgba(255,255,255,0.3)' }}><span style={{ display:'flex',alignItems:'center',gap:3 }}><Calendar style={{ width:10,height:10 }}/>{r.date}</span><span style={{ display:'flex',alignItems:'center',gap:3 }}><Clock style={{ width:10,height:10 }}/>{r.time}</span><span>{r.room}</span><span>Seat{r.seat}</span></div>
                </div>
                <div style={{ textAlign:'right' }}><p style={{ fontSize:15,fontWeight:700,color:isCx?'rgba(255,255,255,0.3)':'#e50914',textDecoration:isCx?'line-through':'none' }}>{r.price} €</p>{i===3&&showCancel&&!cancelled&&<span style={{ fontSize:9,padding:'3px 8px',borderRadius:6,background:'rgba(239,68,68,0.15)',border:'1px solid rgba(239,68,68,0.2)',color:'#ef4444',marginTop:4,display:'inline-block' }}>Cancel</span>}</div>
              </div>
            )})}
          </div>}
        </div>
        {step>=1&&step<=5&&<div style={{ position:'absolute',left:c.x,top:c.y,zIndex:30,pointerEvents:'none',transition:'all 1s cubic-bezier(0.4,0,0.2,1)' }}><MousePointer2 style={{ width:20,height:20,color:'white',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.6))',transform:isClick?'scale(0.75)':'scale(1)',transition:'transform 0.12s' }}/>{isClick&&<span style={{ position:'absolute',top:-4,left:-4,width:28,height:28,borderRadius:'50%',background:'rgba(255,255,255,0.25)',animation:'ping 0.6s ease-out' }}/>}</div>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Admin Dashboard Demo
   ═══════════════════════════════════════════════ */
function AdminDemo({ active }: { active: boolean }) {
  const [step, setStep] = useState(0)
  const tmr = useRef<ReturnType<typeof setTimeout>[]>([])
  const run = useCallback(() => {
    tmr.current.forEach(clearTimeout); tmr.current = []; setStep(0)
    ;[800,2000,3500,5500,7500,9500].forEach((ms,i) => tmr.current.push(setTimeout(() => setStep(i+1), ms)))
    tmr.current.push(setTimeout(run, 12000))
  }, [])
  useEffect(() => { if (active) run(); return () => tmr.current.forEach(clearTimeout) }, [active, run])
  const hoveredStat = step>=2 ? Math.min(step-2,3) : -1
  const sts = [
    { label:'Reservations',value:'1 247',icon:<Ticket style={{ width:16,height:16 }}/>,color:'#e50914' },
    { label:'Total Revenue',value:'14 832 €',icon:<CreditCard style={{ width:16,height:16 }}/>,color:'#22c55e' },
    { label:'Occupancy Rate',value:'73.2%',icon:<Star style={{ width:16,height:16 }}/>,color:'#f5c518' },
    { label:'Customers',value:'342',icon:<Film style={{ width:16,height:16 }}/>,color:'#3b82f6' },
  ]
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const rev = [980,1250,1680,1420,1100,890,760,1340,1560,1720,1480,1650]
  const mxR = Math.max(...rev)
  const topM = [{n:'Avatar 2',e:312},{n:'Inception',e:248},{n:'The Godfather',e:195},{n:'Interstellar',e:178},{n:'Gladiator',e:156}]
  const mxE = topM[0].e
  const rms = [{n:'Room 1',p:82},{n:'Room 2',p:71},{n:'Room 3',p:68},{n:'Room 4',p:55}]
  const cur: Record<number,{x:number;y:number}> = { 0:{x:-30,y:-30},1:{x:500,y:60},2:{x:130,y:85},3:{x:400,y:85},4:{x:680,y:85},5:{x:950,y:85},6:{x:-30,y:-30} }
  const c = cur[Math.min(step,6)]||{x:-30,y:-30}
  return (
    <div style={{ width:'100%', maxWidth:1100, margin:'0 auto' }}>
      <div style={{ borderRadius:'12px 12px 0 0', background:'#181824', border:'1px solid rgba(255,255,255,0.08)', borderBottom:'none', padding:'8px 16px', display:'flex', alignItems:'center', gap:12 }}>
        <div style={{ display:'flex', gap:6 }}><span style={{ width:10,height:10,borderRadius:'50%',background:'#ff5f57' }}/><span style={{ width:10,height:10,borderRadius:'50%',background:'#febc2e' }}/><span style={{ width:10,height:10,borderRadius:'50%',background:'#28c840' }}/></div>
        <div style={{ flex:1, margin:'0 12px', borderRadius:6, background:'rgba(255,255,255,0.05)', padding:'4px 12px', fontSize:12, color:'rgba(255,255,255,0.3)', fontFamily:'monospace' }}>cinema-sage-kappa.vercel.app/admin</div>
      </div>
      <div style={{ position:'relative', borderRadius:'0 0 12px 12px', border:'1px solid rgba(255,255,255,0.08)', borderTop:'none', overflow:'hidden', background:'#0a0a0f', height:480 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}><Film style={{ width:16,height:16,color:'#e50914' }}/><span style={{ fontSize:13,fontWeight:700,color:'#e50914' }}>Cinema Lumière</span></div>
          <span style={{ fontSize:11,color:'#e50914',fontWeight:600 }}>Dashboard Admin</span>
        </div>
        <div style={{ padding:'12px 20px' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
            <div><h3 style={{ fontSize:16,fontWeight:700,color:'rgba(255,255,255,0.85)' }}>Dashboard Admin</h3><p style={{ fontSize:10,color:'rgba(255,255,255,0.25)' }}>Cinema Lumière Overview</p></div>
            <div style={{ display:'flex', borderRadius:8, background:'#12121a', border:'1px solid rgba(255,255,255,0.06)', padding:2 }}>
              <span style={{ padding:'4px 12px',borderRadius:6,fontSize:10,fontWeight:600,background:'#e50914',color:'white' }}>Statistics</span>
              <span style={{ padding:'4px 12px',borderRadius:6,fontSize:10,color:'rgba(255,255,255,0.3)' }}>SQL Queries</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:14 }}>
            {sts.map((s,i) => (
              <div key={s.label} style={{ borderRadius:10, background:'#12121a', border:`1px solid ${hoveredStat===i?s.color+'40':'rgba(255,255,255,0.06)'}`, padding:12, transition:'all 0.4s', transform:hoveredStat===i?'scale(1.04)':'scale(1)', boxShadow:hoveredStat===i?`0 0 20px ${s.color}20`:'none' }}>
                <div style={{ color:s.color, marginBottom:6 }}>{s.icon}</div>
                <p style={{ fontSize:18,fontWeight:700,color:'rgba(255,255,255,0.9)' }}>{s.value}</p>
                <p style={{ fontSize:10,color:'rgba(255,255,255,0.3)' }}>{s.label}</p>
              </div>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            <div style={{ borderRadius:10, background:'#12121a', border:'1px solid rgba(255,255,255,0.06)', padding:12 }}>
              <p style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:10 }}>Revenue by Month (2024)</p>
              <div style={{ display:'flex', alignItems:'flex-end', gap:3, height:100 }}>
                {mo.map((m,i) => (<div key={m} style={{ flex:1,display:'flex',flexDirection:'column',alignItems:'center',gap:3 }}><div style={{ width:'100%',height:(rev[i]/mxR)*80,background:'#e50914',borderRadius:'3px 3px 0 0',opacity:0.7 }}/><span style={{ fontSize:7,color:'rgba(255,255,255,0.2)' }}>{m}</span></div>))}
              </div>
            </div>
            <div style={{ borderRadius:10, background:'#12121a', border:'1px solid rgba(255,255,255,0.06)', padding:12 }}>
              <p style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:10 }}>Pricing Distribution</p>
              <div style={{ display:'flex', alignItems:'center', gap:16 }}>
                <svg viewBox="0 0 100 100" style={{ width:90,height:90 }}><circle cx="50" cy="50" r="40" fill="none" stroke="#e50914" strokeWidth="18" strokeDasharray="100.5 151" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#f5c518" strokeWidth="18" strokeDasharray="62.8 188.5" strokeDashoffset="-100.5" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="18" strokeDasharray="50.3 201" strokeDashoffset="-163.3" transform="rotate(-90 50 50)"/><circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="18" strokeDasharray="37.7 213.6" strokeDashoffset="-213.6" transform="rotate(-90 50 50)"/></svg>
                <div style={{ display:'flex',flexDirection:'column',gap:4 }}>
                  {[{l:'Normal',c:'#e50914',p:'40%'},{l:'Student',c:'#f5c518',p:'25%'},{l:'Senior',c:'#22c55e',p:'20%'},{l:'Child',c:'#3b82f6',p:'15%'}].map(t => (
                    <div key={t.l} style={{ display:'flex',alignItems:'center',gap:5,fontSize:9,color:'rgba(255,255,255,0.4)' }}><span style={{ width:6,height:6,borderRadius:2,background:t.c }}/>{t.l} {t.p}</div>
                  ))}
                </div>
              </div>
            </div>
            <div style={{ borderRadius:10, background:'#12121a', border:'1px solid rgba(255,255,255,0.06)', padding:12 }}>
              <p style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:8 }}>Top 5 Movies by Entries</p>
              <div style={{ display:'flex',flexDirection:'column',gap:5 }}>
                {topM.map(m => (<div key={m.n} style={{ display:'flex',alignItems:'center',gap:8 }}><span style={{ fontSize:9,color:'rgba(255,255,255,0.4)',width:70,textAlign:'right',flexShrink:0 }}>{m.n}</span><div style={{ flex:1,height:12,background:'rgba(255,255,255,0.04)',borderRadius:3,overflow:'hidden' }}><div style={{ height:'100%',width:`${(m.e/mxE)*100}%`,background:'#f5c518',borderRadius:3,opacity:0.7 }}/></div><span style={{ fontSize:9,color:'rgba(255,255,255,0.3)',width:24 }}>{m.e}</span></div>))}
              </div>
            </div>
            <div style={{ borderRadius:10, background:'#12121a', border:'1px solid rgba(255,255,255,0.06)', padding:12 }}>
              <p style={{ fontSize:11,fontWeight:700,color:'rgba(255,255,255,0.6)',marginBottom:8 }}>Occupancy Rate by Room</p>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {rms.map(r => (<div key={r.n} style={{ display:'flex',alignItems:'center',gap:8 }}><span style={{ fontSize:9,color:'rgba(255,255,255,0.4)',width:50,textAlign:'right',flexShrink:0 }}>{r.n}</span><div style={{ flex:1,height:14,background:'rgba(255,255,255,0.04)',borderRadius:3,overflow:'hidden' }}><div style={{ height:'100%',width:`${r.p}%`,background:'#22c55e',borderRadius:3,opacity:0.7 }}/></div><span style={{ fontSize:9,color:'rgba(255,255,255,0.3)',width:28 }}>{r.p}%</span></div>))}
              </div>
            </div>
          </div>
        </div>
        {step>=1&&step<=5&&<div style={{ position:'absolute',left:c.x,top:c.y,zIndex:30,pointerEvents:'none',transition:'all 1s cubic-bezier(0.4,0,0.2,1)' }}><MousePointer2 style={{ width:20,height:20,color:'white',filter:'drop-shadow(0 2px 8px rgba(0,0,0,0.6))' }}/></div>}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Browser Chrome wrapper for static screenshots
   ═══════════════════════════════════════════════ */
function Browser({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ borderRadius: '12px 12px 0 0', background: '#181824', border: '1px solid rgba(255,255,255,0.08)', borderBottom: 'none', padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 6 }}><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} /><span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} /></div>
        <div style={{ flex: 1, margin: '0 12px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', padding: '4px 12px', fontSize: 12, color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{url}</div>
      </div>
      <div style={{ flex: 1, borderRadius: '0 0 12px 12px', border: '1px solid rgba(255,255,255,0.08)', borderTop: 'none', overflow: 'hidden', background: '#0a0a0f' }}>
        {children}
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Expandable Query Card
   ═══════════════════════════════════════════════ */
function QCard({ q }: { q: typeof queries[0] }) {
  return (
    <div style={{ width: '100%', textAlign: 'left' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: '50%', background: 'rgba(229,9,20,0.15)', color: '#e50914', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>{q.id}</span>
        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', fontWeight: 500, lineHeight: 1.3 }}>{q.title}</span>
      </div>
      <Sql code={q.sql} small />
    </div>
  )
}

/* ═══════════════════════════════════════════════
   Slide content builders
   ═══════════════════════════════════════════════ */
const imposed = queries.filter(q => q.id <= 10)
const personal = queries.filter(q => q.id >= 11)
const pM: Record<number, { icon: string; desc: string; res: string }> = {
  11: { icon: '', desc: 'Top 5 customers by spending — reservation count and total amount.', res: 'Data-driven loyalty program' },
  12: { icon: '', desc: 'Monthly aggregated revenue for 2024.', res: 'Seasonality and revenue peaks' },
  13: { icon: '', desc: 'Movies with no confirmed reservations.', res: 'Content to reschedule or re-promote' },
  14: { icon: '', desc: 'Percentage distribution of pricing tiers used.', res: 'Pricing policy optimization' },
  15: { icon: '', desc: 'Top 10 most profitable screenings with occupancy rate.', res: 'Data-driven scheduling' },
}

type SlideData = { id: string; content: (active: boolean) => React.ReactNode }

function buildSlides(): SlideData[] {
  const s: SlideData[] = []

  // 1. Intro
  s.push({ id: 'intro', content: () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 80 }}>
      {/* Left: main content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{ position: 'relative', marginBottom: 40 }}>
          <div style={{ position: 'absolute', inset: 0, filter: 'blur(80px)', background: 'rgba(229,9,20,0.25)', borderRadius: '50%', transform: 'scale(3)' }} />
          <Film style={{ position: 'relative', width: 80, height: 80, color: '#e50914' }} />
        </div>
        <h1 style={{ fontSize: 64, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 8, lineHeight: 1 }}>
          <span style={{ color: '#e50914' }}>Cinema</span>{' '}<span style={{ color: 'rgba(255,255,255,0.9)' }}>Lumière</span>
        </h1>
        <p style={{ fontSize: 22, color: 'rgba(255,255,255,0.3)', marginBottom: 48 }}>Database &amp; Web Application</p>
        <div style={{ display: 'flex', gap: 16, marginBottom: 40 }}>
          {['Askamp', 'Bonan', 'Sala', 'Scao'].map(n => (
            <span key={n} style={{ padding: '10px 24px', borderRadius: 9999, fontSize: 15, fontWeight: 500, border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: 'rgba(255,255,255,0.6)' }}>{n}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.2)', fontSize: 14 }}>
          <GraduationCap style={{ width: 16, height: 16 }} />
          <span>NEOMA Business School — GBBA3 — Prof. Nils Schaefer</span>
        </div>
      </div>
      {/* Right: QR Code */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <div style={{ padding: 16, borderRadius: 16, background: 'white' }}>
          <QRCodeSVG value="https://cinema-sage-kappa.vercel.app" size={160} level="H" />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.4)', fontSize: 13 }}>
          <Smartphone style={{ width: 14, height: 14 }} />
          <span>Scannez pour tester</span>
        </div>
        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>cinema-sage-kappa.vercel.app</span>
      </div>
    </div>
  )})

  // 1b. Table of Contents
  s.push({ id: 'sommaire', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', maxWidth: 600, margin: '0 auto' }}>
      <h2 style={{ fontSize: 32, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 32 }}>Table of Contents</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {[
          { num: '01', label: 'Conceptual Data Model (MCD)' },
          { num: '02', label: 'Logical Data Model (MLD)' },
          { num: '03', label: 'Physical Data Model (MPD) — Part 1' },
          { num: '04', label: 'Physical Data Model (MPD) — Part 2' },
          { num: '05', label: 'SQL Queries personnelles' },
          { num: '06', label: 'User Journey' },
        ].map(item => (
          <div key={item.num} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#e50914', minWidth: 28 }}>{item.num}</span>
            <span style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )})

  // 2. CDM (Conceptual Data Model) — MERISE style
  s.push({ id: 'cdm', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
      <CdmSlide />
    </div>
  )})

  // 3. LDM (Logical Data Model)
  s.push({ id: 'ldm', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
      <LdmSlide />
    </div>
  )})

  // 4. PDM (Physical Data Model) — CREATE TABLE
  s.push({ id: 'pdm', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#e50914', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Step 3</span>
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>PDM — Physical Data Model</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>CREATE TABLE — PostgreSQL / Supabase</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div>
          <Sql code={`CREATE TABLE movies (
  id INT NOT NULL AUTO_INCREMENT,
  title VARCHAR(200) NOT NULL,
  synopsis TEXT,
  duration_min INT NOT NULL,
  release_date DATE,
  poster_url VARCHAR(500),
  director VARCHAR(100),
  PRIMARY KEY(id)
);`} small />
          <div style={{ height: 8 }} />
          <Sql code={`CREATE TABLE screenings (
  id INT NOT NULL AUTO_INCREMENT,
  movie_id INT NOT NULL,
  room_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  base_price FLOAT NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY(movie_id)
    REFERENCES movies(id),
  FOREIGN KEY(room_id)
    REFERENCES rooms(id)
);`} small />
        </div>
        <div>
          <Sql code={`CREATE TABLE movie_categories (
  movie_id INT NOT NULL,
  category_id INT NOT NULL,
  PRIMARY KEY(movie_id, category_id),
  FOREIGN KEY(movie_id)
    REFERENCES movies(id),
  FOREIGN KEY(category_id)
    REFERENCES categories(id)
);`} small />
          <div style={{ height: 8 }} />
          <Sql code={`CREATE TABLE reservations (
  id INT NOT NULL AUTO_INCREMENT,
  customer_id INT NOT NULL,
  screening_id INT NOT NULL,
  seat_id INT NOT NULL,
  pricing_id INT NOT NULL,
  amount_paid FLOAT NOT NULL,
  status VARCHAR(20) DEFAULT 'confirmed',
  PRIMARY KEY(id),
  FOREIGN KEY(customer_id)
    REFERENCES customers(id),
  FOREIGN KEY(screening_id)
    REFERENCES screenings(id),
  FOREIGN KEY(seat_id)
    REFERENCES seats(id),
  FOREIGN KEY(pricing_id)
    REFERENCES pricing(id)
);`} small />
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
        <span>9 tables total</span>
        <span>INT, VARCHAR, TEXT, DATE, DATETIME, FLOAT</span>
        <span>PRIMARY KEY + FOREIGN KEY REFERENCES</span>
        <span>AUTO_INCREMENT, NOT NULL, DEFAULT</span>
      </div>
    </div>
  )})

  // 5. PDM suite — tables restantes
  s.push({ id: 'pdm2', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: '#e50914', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Step 3 (continued)</span>
      </div>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Physical Data Model</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>categories, rooms, seats, customers, pricing</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1, overflow: 'auto', minHeight: 0 }}>
        <div>
          <Sql code={`CREATE TABLE categories (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  PRIMARY KEY(id)
);`} small />
          <div style={{ height: 8 }} />
          <Sql code={`CREATE TABLE rooms (
  id INT NOT NULL AUTO_INCREMENT,
  name VARCHAR(50) NOT NULL,
  capacity INT NOT NULL,
  PRIMARY KEY(id)
);`} small />
          <div style={{ height: 8 }} />
          <Sql code={`CREATE TABLE seats (
  id INT NOT NULL AUTO_INCREMENT,
  row_letter CHAR(1) NOT NULL,
  seat_number INT NOT NULL,
  seat_type VARCHAR(20) DEFAULT 'standard',
  room_id INT NOT NULL,
  PRIMARY KEY(id),
  FOREIGN KEY(room_id)
    REFERENCES rooms(id)
);`} small />
        </div>
        <div>
          <Sql code={`CREATE TABLE customers (
  id INT NOT NULL AUTO_INCREMENT,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(200) NOT NULL,
  birth_date DATE,
  PRIMARY KEY(id)
);`} small />
          <div style={{ height: 8 }} />
          <Sql code={`CREATE TABLE pricing (
  id INT NOT NULL AUTO_INCREMENT,
  label VARCHAR(50) NOT NULL,
  multiplier FLOAT NOT NULL,
  PRIMARY KEY(id)
);`} small />
        </div>
      </div>
      <div style={{ marginTop: 8, display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 8 }}>
        <span>5 tables simples</span>
        <span>seats : FK vers rooms (Règle 2)</span>
        <span>categories, rooms, customers, pricing : pas de FK</span>
      </div>
    </div>
  )})

  // 6. (removed — imposed queries)

  // 4-8. Personal queries
  personal.forEach(q => {
    const m = pM[q.id]
    s.push({ id: `q${q.id}`, content: () => (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <span style={{ fontSize: 32 }}>{m.icon}</span>
          <div>
            <span style={{ fontSize: 11, color: '#e50914', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' as const }}>Query {q.id}</span>
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{q.title}</h2>
          </div>
        </div>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 16 }}>{m.desc}</p>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}><Sql code={q.sql} /></div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: 12 }}>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: 'rgba(229,9,20,0.5)' }} />
          <span style={{ fontStyle: 'italic' }}>{m.res}</span>
        </div>
      </div>
    )})
  })

  // ═══ PARCOURS UTILISATEUR — static slides ═══

  // 9. Catalogue
  s.push({ id: 'app-catalog', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>User Journey — Catalog</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Page d&apos;accueil · Films à l&apos;affiche</p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Browser url="cinema-sage-kappa.vercel.app/">
          <div style={{ padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Film style={{ width: 16, height: 16, color: '#e50914' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#e50914' }}>Cinema Lumière</span></div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}><span>Connexion</span><span style={{ padding: '3px 10px', borderRadius: 6, background: '#e50914', color: 'white', fontSize: 10, fontWeight: 600 }}>Inscription</span></div>
          </div>
          <div style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}><Film style={{ width: 14, height: 14, color: '#e50914' }} /><span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>À l&apos;affiche</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 14 }}>
              {MOVIES.map(m => (
                <div key={m.title} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ aspectRatio: '2/3', position: 'relative', background: `linear-gradient(135deg, ${m.color}40, ${m.color}10)` }}>
                    <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Star style={{ width: 28, height: 28, color: `${m.color}50` }} /></div>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 60%)' }} />
                    <div style={{ position: 'absolute', bottom: 8, left: 8, right: 8 }}><p style={{ fontSize: 13, fontWeight: 700, color: 'white', lineHeight: 1.2 }}>{m.title}</p><p style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)', marginTop: 3 }}>{m.dir}</p></div>
                  </div>
                  <div style={{ padding: 8, background: '#12121a' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}><Clock style={{ width: 10, height: 10 }} />{m.dur} min<span style={{ marginLeft: 'auto' }}>{m.yr}</span></div>
                    <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 600, background: `${m.color}20`, color: m.color }}>{m.genre}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Browser>
      </div>
    </div>
  )})

  // 10. Réservation — sélection de sièges
  s.push({ id: 'app-booking', content: () => {
    const seatRows = ['A','B','C','D','E','F']
    const reserved = ['A3','A4','B6','C2','C3','D7','E1','F4','F5']
    const selected = ['C5','C6']
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>User Journey — Booking</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Sélection des places · Résumé de commande</p>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Browser url="cinema-sage-kappa.vercel.app/booking/42">
            <div style={{ padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Film style={{ width: 16, height: 16, color: '#e50914' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#e50914' }}>Cinema Lumière</span></div>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Marie Dupont</span>
            </div>
            <div style={{ display: 'flex', height: '100%' }}>
              <div style={{ flex: 1, padding: 20 }}>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>Choisissez vos places</h3>
                <div style={{ borderRadius: 14, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 20 }}>
                  <svg viewBox="0 0 300 20" style={{ width: '70%', margin: '0 auto 8px', display: 'block' }}><path d="M 20 16 Q 150 2 280 16" fill="none" stroke="#e50914" strokeWidth="2.5" strokeLinecap="round" /></svg>
                  <p style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginBottom: 16, letterSpacing: '0.15em' }}>ÉCRAN</p>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    {seatRows.map(row => (
                      <div key={row} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <span style={{ width: 18, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: 600 }}>{row}</span>
                        {Array.from({ length: 8 }, (_, j) => { const sid = `${row}${j+1}`; const isR = reserved.includes(sid), isS = selected.includes(sid); return (
                          <div key={j} style={{ display: 'flex', alignItems: 'center' }}>
                            {j === 4 && <div style={{ width: 16 }} />}
                            <div style={{ width: 28, height: 28, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, background: isS ? '#3b82f6' : isR ? 'rgba(239,68,68,0.25)' : '#1a1a2e', color: isS ? 'white' : isR ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.3)', border: `1.5px solid ${isS ? '#3b82f6' : isR ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.07)'}`, boxShadow: isS ? '0 0 12px rgba(59,130,246,0.4)' : 'none' }}>{j+1}</div>
                          </div>
                        )})}
                        <span style={{ width: 18, fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center', fontWeight: 600 }}>{row}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 14, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.07)' }} /> Disponible</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: '#3b82f6' }} /> Sélectionné</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(239,68,68,0.25)' }} /> Réservé</span>
                  </div>
                </div>
              </div>
              <div style={{ width: 240, padding: 20, borderLeft: '1px solid rgba(255,255,255,0.05)' }}>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.85)', marginBottom: 16 }}>Résumé</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)' }}><Film style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.25)' }} /> Avatar 2</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)' }}><Calendar style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }} /> March 15, 2024</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)' }}><Clock style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }} /> 20:00</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.4)' }}><MapPin style={{ width: 14, height: 14, color: 'rgba(255,255,255,0.2)' }} /> Room 1</div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Places sélectionnées (2)</p>
                  <div style={{ display: 'flex', gap: 6 }}>{selected.map(s => <span key={s} style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', fontSize: 11, fontWeight: 600 }}>{s}</span>)}</div>
                </div>
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Total</span><span style={{ fontSize: 20, fontWeight: 700, color: '#e50914' }}>24.00 €</span></div>
                </div>
                <button style={{ width: '100%', marginTop: 16, padding: '10px 0', borderRadius: 8, border: 'none', fontSize: 12, fontWeight: 600, background: '#e50914', color: 'white', cursor: 'pointer' }}>Réserver 2 place(s)</button>
              </div>
            </div>
          </Browser>
        </div>
      </div>
    )
  }})

  // 11. Confirmation
  s.push({ id: 'app-confirm', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>User Journey — Confirmation</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Réservation validée · Récapitulatif</p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Browser url="cinema-sage-kappa.vercel.app/booking/done">
          <div style={{ padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Film style={{ width: 16, height: 16, color: '#e50914' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#e50914' }}>Cinema Lumière</span></div>
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>Marie Dupont</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 420 }}>
            <div style={{ textAlign: 'center', padding: 32, borderRadius: 20, background: '#12121a', border: '1px solid rgba(34,197,94,0.25)', maxWidth: 320 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(34,197,94,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}><Check style={{ width: 28, height: 28, color: '#4ade80' }} /></div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 6 }}>Réservation confirmée !</h3>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>Avatar 2 · Room 1 · 20:00</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginBottom: 12 }}>2 places — C5, C6</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: '#e50914' }}>24.00 €</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'center' }}>
                <span style={{ padding: '6px 16px', borderRadius: 8, background: '#e50914', color: 'white', fontSize: 12, fontWeight: 600 }}>Mes réservations</span>
                <span style={{ padding: '6px 16px', borderRadius: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>Accueil</span>
              </div>
            </div>
          </div>
        </Browser>
      </div>
    </div>
  )})

  // 12. Mes billets
  s.push({ id: 'app-account', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>User Journey — My Tickets</h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Profile · Reservations · Cancellation</p>
      <div style={{ flex: 1, minHeight: 0 }}>
        <Browser url="cinema-sage-kappa.vercel.app/account">
          <div style={{ padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Film style={{ width: 16, height: 16, color: '#e50914' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#e50914' }}>Cinema Lumière</span></div>
            <div style={{ display: 'flex', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}><span>Films</span><span style={{ color: '#e50914', fontWeight: 600 }}>Mon compte</span></div>
          </div>
          <div style={{ padding: 20, maxWidth: 700, margin: '0 auto' }}>
            <div style={{ borderRadius: 12, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 16, display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(229,9,20,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontSize: 20, color: '#e50914' }}>M</span></div>
              <div><p style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Marie Dupont</p><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>marie.dupont@email.com</p></div>
            </div>
            <div style={{ borderRadius: 12, background: '#12121a', border: '1px solid rgba(229,9,20,0.3)', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Ticket style={{ width: 16, height: 16, color: '#e50914' }} /><span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Mes réservations (4)</span></div>
              <ChevronDown style={{ width: 16, height: 16, color: 'rgba(255,255,255,0.3)', transform: 'rotate(180deg)' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { film: 'Avatar 2', date: 'March 15, 2024', time: '20:00', room: 'Room 1', seat: 'C5', price: '12.00', cx: false },
                { film: 'Avatar 2', date: 'March 15, 2024', time: '20:00', room: 'Room 1', seat: 'C6', price: '12.00', cx: false },
                { film: 'Inception', date: 'March 10, 2024', time: '14:30', room: 'Room 3', seat: 'E8', price: '9.50', cx: false },
                { film: 'The Godfather', date: 'March 5, 2024', time: '21:00', room: 'Room 2', seat: 'B3', price: '14.00', cx: true },
              ].map((r, i) => (
                <div key={i} style={{ borderRadius: 10, background: '#12121a', border: `1px solid ${r.cx ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', opacity: r.cx ? 0.5 : 1 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}><Film style={{ width: 12, height: 12, color: r.cx ? 'rgba(255,255,255,0.3)' : '#e50914' }} /><span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{r.film}</span>{r.cx && <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 10, background: 'rgba(239,68,68,0.2)', color: '#ef4444' }}>Cancelled</span>}</div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Calendar style={{ width: 10, height: 10 }} />{r.date}</span><span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Clock style={{ width: 10, height: 10 }} />{r.time}</span><span>{r.room}</span><span>Seat{r.seat}</span></div>
                  </div>
                  <div style={{ textAlign: 'right' }}><p style={{ fontSize: 15, fontWeight: 700, color: r.cx ? 'rgba(255,255,255,0.3)' : '#e50914', textDecoration: r.cx ? 'line-through' : 'none' }}>{r.price} €</p>
                    {!r.cx && <span style={{ fontSize: 9, padding: '3px 8px', borderRadius: 6, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', marginTop: 4, display: 'inline-block' }}>Cancel</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Browser>
      </div>
    </div>
  )})

  // ═══ PARCOURS PROPRIÉTAIRE ═══

  // 13. Dashboard admin
  s.push({ id: 'app-admin', content: () => {
    const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const rev = [980,1250,1680,1420,1100,890,760,1340,1560,1720,1480,1650]
    const mxR = Math.max(...rev)
    const topM = [{n:'Avatar 2',e:312},{n:'Inception',e:248},{n:'The Godfather',e:195},{n:'Interstellar',e:178},{n:'Gladiator',e:156}]
    const mxE = topM[0].e
    const rms = [{n:'Room 1',p:82},{n:'Room 2',p:71},{n:'Room 3',p:68},{n:'Room 4',p:55}]
    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: '0 8px' }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginBottom: 4 }}>Owner Journey — Dashboard</h2>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>Key Figures · Charts · Overview</p>
        <div style={{ flex: 1, minHeight: 0 }}>
          <Browser url="cinema-sage-kappa.vercel.app/admin">
            <div style={{ padding: '8px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Film style={{ width: 16, height: 16, color: '#e50914' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#e50914' }}>Cinema Lumière</span></div>
              <span style={{ fontSize: 11, color: '#e50914', fontWeight: 600 }}>Dashboard Admin</span>
            </div>
            <div style={{ padding: '12px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div><h3 style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.85)' }}>Dashboard Admin</h3><p style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Cinema Lumière Overview</p></div>
                <div style={{ display: 'flex', borderRadius: 8, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 2 }}>
                  <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 10, fontWeight: 600, background: '#e50914', color: 'white' }}>Statistics</span>
                  <span style={{ padding: '4px 12px', borderRadius: 6, fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>SQL Queries</span>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
                {[{ l:'Reservations',v:'1 247',c:'#e50914',icon:<Ticket style={{ width:16,height:16 }}/> },{ l:'Total Revenue',v:'14 832 €',c:'#22c55e',icon:<CreditCard style={{ width:16,height:16 }}/> },{ l:'Occupancy Rate',v:'73.2%',c:'#f5c518',icon:<Star style={{ width:16,height:16 }}/> },{ l:'Customers',v:'342',c:'#3b82f6',icon:<Film style={{ width:16,height:16 }}/> }].map(s => (
                  <div key={s.l} style={{ borderRadius: 10, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
                    <div style={{ color: s.c, marginBottom: 6 }}>{s.icon}</div>
                    <p style={{ fontSize: 18, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>{s.v}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{s.l}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ borderRadius: 10, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Revenue by Month (2024)</p>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 100 }}>
                    {mo.map((m, i) => (<div key={m} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}><div style={{ width: '100%', height: (rev[i]/mxR)*80, background: '#e50914', borderRadius: '3px 3px 0 0', opacity: 0.7 }} /><span style={{ fontSize: 7, color: 'rgba(255,255,255,0.2)' }}>{m}</span></div>))}
                  </div>
                </div>
                <div style={{ borderRadius: 10, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>Pricing Distribution</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <svg viewBox="0 0 100 100" style={{ width: 90, height: 90 }}><circle cx="50" cy="50" r="40" fill="none" stroke="#e50914" strokeWidth="18" strokeDasharray="100.5 151" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" r="40" fill="none" stroke="#f5c518" strokeWidth="18" strokeDasharray="62.8 188.5" strokeDashoffset="-100.5" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="18" strokeDasharray="50.3 201" strokeDashoffset="-163.3" transform="rotate(-90 50 50)" /><circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="18" strokeDasharray="37.7 213.6" strokeDashoffset="-213.6" transform="rotate(-90 50 50)" /></svg>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {[{l:'Normal',c:'#e50914',p:'40%'},{l:'Student',c:'#f5c518',p:'25%'},{l:'Senior',c:'#22c55e',p:'20%'},{l:'Child',c:'#3b82f6',p:'15%'}].map(t => (<div key={t.l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, color: 'rgba(255,255,255,0.4)' }}><span style={{ width: 6, height: 6, borderRadius: 2, background: t.c }} />{t.l} {t.p}</div>))}
                    </div>
                  </div>
                </div>
                <div style={{ borderRadius: 10, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Top 5 Movies by Entries</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    {topM.map(m => (<div key={m.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', width: 70, textAlign: 'right', flexShrink: 0 }}>{m.n}</span><div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${(m.e/mxE)*100}%`, background: '#f5c518', borderRadius: 3, opacity: 0.7 }} /></div><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', width: 24 }}>{m.e}</span></div>))}
                  </div>
                </div>
                <div style={{ borderRadius: 10, background: '#12121a', border: '1px solid rgba(255,255,255,0.06)', padding: 12 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 8 }}>Occupancy Rate by Room</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {rms.map(r => (<div key={r.n} style={{ display: 'flex', alignItems: 'center', gap: 8 }}><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', width: 50, textAlign: 'right', flexShrink: 0 }}>{r.n}</span><div style={{ flex: 1, height: 14, background: 'rgba(255,255,255,0.04)', borderRadius: 3, overflow: 'hidden' }}><div style={{ height: '100%', width: `${r.p}%`, background: '#22c55e', borderRadius: 3, opacity: 0.7 }} /></div><span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', width: 28 }}>{r.p}%</span></div>))}
                  </div>
                </div>
              </div>
            </div>
          </Browser>
        </div>
      </div>
    )
  }})

  // 14. Conclusion
  s.push({ id: 'conclusion', content: () => (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 40px', maxWidth: 700, margin: '0 auto' }}>
      <p style={{ textAlign: 'center', fontSize: 36, fontWeight: 700, color: 'rgba(255,255,255,0.9)' }}>Thank you<span style={{ color: '#e50914' }}>!</span></p>
      <p style={{ textAlign: 'center', fontSize: 15, color: 'rgba(255,255,255,0.25)', marginTop: 8 }}>Any questions?</p>
    </div>
  )})

  return s
}

/* ═══════════════════════════════════════════════
   Main
   ═══════════════════════════════════════════════ */
export default function PresentationPage() {
  useHideChrome()
  const slides = buildSlides()
  const [current, setCurrent] = useState(0)
  const [isFs, setIsFs] = useState(false)
  const [animKey, setAnimKey] = useState(0)

  const go = useCallback((i: number) => {
    if (i < 0 || i >= slides.length) return
    setCurrent(i); setAnimKey(k => k + 1)
  }, [slides.length])

  const next = useCallback(() => go(current + 1), [current, go])
  const prev = useCallback(() => go(current - 1), [current, go])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next() }
      if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      if (e.key === 'f' || e.key === 'F') {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen()
        else document.exitFullscreen()
      }
      if (e.key === 'Escape' && document.fullscreenElement) document.exitFullscreen()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [next, prev])

  useEffect(() => {
    const h = () => setIsFs(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#08080c', zIndex: 50, overflow: 'hidden' }}>
      {/* Slide */}
      <div key={animKey} style={{ position: 'absolute', inset: 0, padding: '24px 48px', animation: 'fadeIn 0.4s ease-out' }}>
        {slides[current].content(slides[current].id === 'demo')}
      </div>

      {/* Left arrow */}
      {current > 0 && (
        <button onClick={prev} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 60, borderRadius: 9999, background: 'rgba(255,255,255,0.04)', border: 'none', padding: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s' }}>
          <ChevronLeft style={{ width: 20, height: 20 }} />
        </button>
      )}
      {/* Right arrow */}
      {current < slides.length - 1 && (
        <button onClick={next} style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', zIndex: 60, borderRadius: 9999, background: 'rgba(255,255,255,0.04)', border: 'none', padding: 12, color: 'rgba(255,255,255,0.3)', cursor: 'pointer', transition: 'all 0.2s' }}>
          <ChevronRight style={{ width: 20, height: 20 }} />
        </button>
      )}

      {/* Bottom right */}
      <div style={{ position: 'absolute', bottom: 16, right: 20, zIndex: 60, display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)', fontFamily: 'monospace' }}>{current + 1}/{slides.length}</span>
        <button onClick={() => { if (!document.fullscreenElement) document.documentElement.requestFullscreen(); else document.exitFullscreen() }}
          style={{ borderRadius: 8, padding: 8, color: 'rgba(255,255,255,0.2)', background: 'none', border: 'none', cursor: 'pointer' }} title="Fullscreen (F)">
          {isFs ? <Minimize style={{ width: 16, height: 16 }} /> : <Maximize style={{ width: 16, height: 16 }} />}
        </button>
      </div>
    </div>
  )
}
