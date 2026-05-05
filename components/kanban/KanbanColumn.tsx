'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import KanbanCard from './KanbanCard'
import type { Lead, LeadEtapa } from '@/types'

const ETAPA_COLORS: Record<LeadEtapa, string> = {
  'Lead Gerado':       'var(--bl)',
  'Contato Realizado': 'var(--cy)',
  'Proposta Enviada':  'var(--wr)',
  'Negociação':        'var(--or)',
  'Fechado':           'var(--ok)',
  'Perdido':           'var(--er)',
}

interface KanbanColumnProps {
  etapa: LeadEtapa
  leads: Lead[]
  onEditCard: (lead: Lead) => void
  onDeleteCard: (lead: Lead) => void
}

export default function KanbanColumn({ etapa, leads, onEditCard, onDeleteCard }: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa })

  const totalValor = leads.reduce((s, l) => s + l.valor_potencial, 0)
  const valorStr = totalValor >= 1000 ? `R$ ${(totalValor / 1000).toFixed(1)}k` : `R$ ${totalValor}`

  return (
    <div
      ref={setNodeRef}
      className={`kb-col${isOver ? ' kb-over' : ''}`}
      style={{ borderTop: `2px solid ${ETAPA_COLORS[etapa]}` }}
    >
      <div className="kb-hd">
        <div className="kb-hn">
          <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: ETAPA_COLORS[etapa] }} />
          {etapa}
        </div>
        <span className="kb-cnt">{leads.length}</span>
      </div>

      {totalValor > 0 && (
        <div style={{ padding: '5px 12px 0', fontSize: '9.5px', color: 'var(--gr3)', fontFamily: 'var(--mono)' }}>
          {valorStr}
        </div>
      )}

      <div className="kb-body">
        <SortableContext items={leads.map(l => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map(lead => (
            <KanbanCard
              key={lead.id}
              lead={lead}
              onEdit={() => onEditCard(lead)}
              onDelete={() => onDeleteCard(lead)}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--bk5)', fontSize: '11px' }}>
            Arraste cards aqui
          </div>
        )}
      </div>
    </div>
  )
}
