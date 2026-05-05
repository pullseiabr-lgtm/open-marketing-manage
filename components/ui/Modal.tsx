'use client'

import { useEffect } from 'react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  size?: 'default' | 'lg'
  children: React.ReactNode
  footer?: React.ReactNode
}

export default function Modal({ open, onClose, title, size = 'default', children, footer }: ModalProps) {
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="ov open" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className={`modal${size === 'lg' ? ' lg' : ''}`}>
        <div className="mhd">
          <div className="mtt">{title}</div>
          <button className="mx" onClick={onClose}>✕</button>
        </div>
        <div className="mbd">{children}</div>
        {footer && <div className="mft">{footer}</div>}
      </div>
    </div>
  )
}
