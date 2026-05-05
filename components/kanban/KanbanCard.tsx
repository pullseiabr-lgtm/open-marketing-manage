'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Lead } from '@/types'
import { moneyK, tempColor, tempLabel } from '@/lib/utils'

interface KanbanCardProps {
  lead: Lead
  isDragging?: boolean
  onEdit: () => void
  onDelete: () => void
}

const ORIGEM_COLORS: Record<string, string> = {
  'Google Ads': 'var(--cy)',
  'Instagram': '#E1306C',
  'LinkedIn': '#0077B5',
  'WhatsApp': '#25D366',
  'Indicação': 'var(--pu)',
  'YouTube': '#FF0000',
  'Marketplace': 'var(--wr)',
}

export default function KanbanCard({ lead, isDragging = false, onEdit, onDelete }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging: isSortDragging } = useSortable({ id: lead.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.45 : 1,
  }

  const diasNoPipeline = Math.floor(
    (Date.now() - new Date(lead.created_at).getTime()) / (1000 * 60 * 60 * 24)
  )

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`kb-card${isDragging ? ' dragging' : ''}`}
    >
      <div className="kb-cn">{lead.nome}</div>
      <div className="kb-cm">{lead.contato}</div>

      <div className="kb-ft">
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {lead.origem && (
            <span style={{
              fontSize: '8.5px', fontWeight: 700, padding: '1px 5px', borderRadius: '10px',
              background: `${ORIGEM_COLORS[lead.origem] ?? 'var(--gr)'}22`,
              color: ORIGEM_COLORS[lead.origem] ?? 'var(--gr3)',
              border: `1px solid ${ORIGEM_COLORS[lead.origem] ?? 'var(--gr)'}44`,
            }}>
              {lead.origem}
            </span>
          )}
          <span style={{ fontSize: '8.5px', fontWeight: 700, color: tempColor(lead.temperatura) }}>
            {lead.temperatura === 'hot' ? '🔥' : lead.temperatura === 'warm' ? '🟡' : '🔵'}
          </span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--or)', fontFamily: 'var(--mono)' }}>
            {moneyK(lead.valor_potencial)}
          </div>
          <div style={{ fontSize: '8.5px', color: 'var(--gr3)' }}>{diasNoPipeline}d</div>
        </div>
      </div>

      {lead.responsavel && (
        <div style={{ marginTop: '5px', fontSize: '9px', color: 'var(--gr3)' }}>
          → {lead.responsavel}
        </div>
      )}

      {/* Ações — só visíveis no hover */}
      <div
        style={{ display: 'flex', gap: '3px', marginTop: '7px' }}
        onClick={e => e.stopPropagation()}
        onPointerDown={e => e.stopPropagation()}
      >
        <button
          className="ib"
          style={{ width: '20px', height: '20px' }}
          onClick={e => { e.stopPropagation(); onEdit() }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '9px', height: '9px' }}>
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
        <button
          className="ib rd"
          style={{ width: '20px', height: '20px' }}
          onClick={e => { e.stopPropagation(); onDelete() }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '9px', height: '9px' }}>
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
