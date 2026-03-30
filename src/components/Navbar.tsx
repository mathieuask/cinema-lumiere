'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Film, User, LogOut, LayoutDashboard, MonitorPlay, Menu, X } from 'lucide-react'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export default function Navbar() {
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [open, setOpen] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  // Close menu on route change (link click)
  const close = () => setOpen(false)

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navLinks = (
    <>
      <Link
        href="/presentation"
        onClick={close}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
      >
        <MonitorPlay className="h-4 w-4" />
        Presentation
      </Link>
      {user ? (
        <>
          <Link
            href="/account"
            onClick={close}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <User className="h-4 w-4" />
            My Account
          </Link>
          <Link
            href="/admin"
            onClick={close}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            <LayoutDashboard className="h-4 w-4" />
            Admin
          </Link>
          <button
            onClick={() => { close(); handleLogout() }}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted hover:text-danger transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Log Out
          </button>
        </>
      ) : (
        <>
          <Link
            href="/login"
            onClick={close}
            className="rounded-lg px-4 py-2 text-sm text-muted hover:text-foreground transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            onClick={close}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors text-center"
          >
            Sign Up
          </Link>
        </>
      )}
    </>
  )

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 sm:h-16 items-center justify-between">
          <Link href="/" onClick={close} className="flex items-center gap-2 text-lg sm:text-xl font-bold text-primary">
            <Film className="h-5 w-5 sm:h-6 sm:w-6" />
            <span>Cinema Lumiere</span>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-4">
            {navLinks}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setOpen(o => !o)}
            className="md:hidden flex items-center justify-center rounded-lg p-2 text-muted hover:text-foreground transition-colors"
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-xl">
          <div className="flex flex-col gap-1 px-4 py-3">
            {navLinks}
          </div>
        </div>
      )}
    </nav>
  )
}
