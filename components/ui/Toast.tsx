'use client'

import { useEffect, useState } from 'react'

export type ToastType = 'ok' | 'er'

interface ToastState {
  msg: string
  type: ToastType
  visible: boolean
}

let _show: ((msg: string, type?: ToastType) => void) | null = null

export function showToast(msg: string, type: ToastType = 'ok') {
  _show?.(msg, type)
}

export default function Toast() {
  const [state, setState] = useState<ToastState>({ msg: '', type: 'ok', visible: false })
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    _show = (msg, type = 'ok') => {
      if (timer) clearTimeout(timer)
      setState({ msg, type, visible: true })
      const t = setTimeout(() => setState(s => ({ ...s, visible: false })), 3000)
      setTimer(t)
    }
    return () => { _show = null }
  }, [timer])

  if (!state.visible) return null

  return (
    <div
      className="toast"
      style={{ background: state.type === 'er' ? 'var(--er)' : 'var(--ok)' }}
    >
      {state.type === 'ok' ? '✓' : '✕'} {state.msg}
    </div>
  )
}
