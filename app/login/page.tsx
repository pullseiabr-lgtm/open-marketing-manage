'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bk)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      fontFamily: 'var(--f)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '380px',
        background: 'var(--bk2)',
        border: '1px solid var(--bk4)',
        borderRadius: '16px',
        padding: '32px',
        boxShadow: '0 24px 64px rgba(0,0,0,.5)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '28px' }}>
          <div style={{
            width: '42px', height: '42px',
            background: 'var(--or)', borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <span style={{ fontWeight: 900, fontSize: '22px', color: '#fff', letterSpacing: '-.05em' }}>n</span>
          </div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--wh)', letterSpacing: '-.02em' }}>Open</div>
            <div style={{ fontSize: '9px', color: 'var(--gr3)', textTransform: 'uppercase', letterSpacing: '.15em' }}>
              Soluções Industriais
            </div>
          </div>
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: 'var(--wh)', marginBottom: '4px' }}>
            Acesso ao Sistema
          </div>
          <div style={{ fontSize: '11.5px', color: 'var(--gr3)' }}>
            Gestão Inteligente de Marketing
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '12px' }}>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--gr3)', marginBottom: '4px' }}>
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="seu@email.com"
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid var(--bk4)', borderRadius: 'var(--r)',
                fontSize: '12px', color: 'var(--lgt)', background: 'var(--bk3)',
                outline: 'none', fontFamily: 'var(--f)',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '10.5px', fontWeight: 600, color: 'var(--gr3)', marginBottom: '4px' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              style={{
                width: '100%', padding: '9px 12px',
                border: '1px solid var(--bk4)', borderRadius: 'var(--r)',
                fontSize: '12px', color: 'var(--lgt)', background: 'var(--bk3)',
                outline: 'none', fontFamily: 'var(--f)',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '8px 12px', background: 'rgba(239,68,68,.1)',
              border: '1px solid rgba(239,68,68,.25)', borderRadius: 'var(--r)',
              fontSize: '11.5px', color: 'var(--er)', marginBottom: '14px',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '10px',
              background: loading ? 'var(--bk4)' : 'var(--or)',
              border: 'none', borderRadius: 'var(--r)',
              fontSize: '12px', fontWeight: 700, color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontFamily: 'var(--f)',
              transition: '.13s',
            }}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bk3)', borderRadius: 'var(--r)' }}>
          <div style={{ fontSize: '9.5px', fontWeight: 700, color: 'var(--or2)', marginBottom: '4px' }}>
            ℹ️ Primeiro acesso
          </div>
          <div style={{ fontSize: '10.5px', color: 'var(--gr3)', lineHeight: 1.5 }}>
            Crie sua conta via Supabase Dashboard ou peça ao administrador do sistema.
          </div>
        </div>
      </div>
    </div>
  )
}
