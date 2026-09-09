'use client'

import { FormEvent, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const supabase = useMemo(() => createClient(), [])
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [ready, setReady] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!supabase) {
      setError('Authentication is currently unavailable.')
      return
    }

    let active = true

    const finishRecovery = () => {
      if (active) setReady(true)
    }

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) finishRecovery()
    })

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY' && session) finishRecovery()
    })

    const timer = window.setTimeout(() => {
      if (active) {
        setReady(current => current)
        setError(current => current || 'This password reset link is invalid or has expired. Please request a new one.')
      }
    }, 4000)

    return () => {
      active = false
      window.clearTimeout(timer)
      data.subscription.unsubscribe()
    }
  }, [supabase])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setMessage('')

    if (password.length < 8) {
      setError('Your new password must be at least 8 characters long.')
      return
    }

    if (password !== confirm) {
      setError('The passwords do not match.')
      return
    }

    if (!supabase) return

    setSaving(true)
    const { error: updateError } = await supabase.auth.updateUser({ password })
    setSaving(false)

    if (updateError) {
      setError(updateError.message)
      return
    }

    setPassword('')
    setConfirm('')
    setMessage('Your password has been updated successfully. You can now sign in with your new password.')
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="eyebrow">SkyShotConner / Account security</div>
        <h1>Choose a new password.</h1>
        <p className="auth-intro">
          Create a new password for your SkyShotConner account.
        </p>

        {message ? (
          <div className="auth-message success">{message}</div>
        ) : (
          <form onSubmit={submit} className="auth-form">
            <label>
              New password
              <input
                type="password"
                value={password}
                onChange={event => setPassword(event.target.value)}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                disabled={!ready || saving}
                required
              />
            </label>

            <label>
              Confirm password
              <input
                type="password"
                value={confirm}
                onChange={event => setConfirm(event.target.value)}
                autoComplete="new-password"
                placeholder="Enter it again"
                disabled={!ready || saving}
                required
              />
            </label>

            {error && <div className="auth-message error">{error}</div>}

            <button className="auth-submit" type="submit" disabled={!ready || saving}>
              {saving ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>THE ART OF FLIGHT.</span>
        </div>
      </section>
    </main>
  )
}
