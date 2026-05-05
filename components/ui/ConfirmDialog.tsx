'use client'

import { useState } from 'react'

interface ConfirmState {
  open: boolean
  msg: string
  cb: (() => void) | null
}

let _confirm: ((msg: string, cb: () => void) => void) | null = null

export function confirmDialog(msg: string, cb: () => void) {
  _confirm?.(msg, cb)
}

export default function ConfirmDialog() {
  const [state, setState] = useState<ConfirmState>({ open: false, msg: '', cb: null })

  // register
  if (_confirm === null) {
    _confirm = (msg, cb) => setState({ open: true, msg, cb })
  }

  function close() { setState({ open: false, msg: '', cb: null }) }

  function confirm() {
    state.cb?.()
    close()
  }

  if (!state.open) return null

  return (
    <div className="cnf-box">
      <div className="cnf-inner">
        <div style={{ fontSize: '13px', fontWeight: 700, textAlign: 'center', marginBottom: '6px', color: 'var(--wh)' }}>
          Confirmar Exclusão
        </div>
        <div style={{ fontSize: '11.5px', color: 'var(--gr3)', textAlign: 'center', marginBottom: '14px' }}>
          {state.msg}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn" style={{ flex: 1, justifyContent: 'center' }} onClick={close}>
            Cancelar
          </button>
          <button className="btn er" style={{ flex: 1, justifyContent: 'center' }} onClick={confirm}>
            Excluir
          </button>
        </div>
      </div>
    </div>
  )
}
