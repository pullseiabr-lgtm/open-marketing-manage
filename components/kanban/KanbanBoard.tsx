'use client'

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { useState } from 'react'
import KanbanColumn from './KanbanColumn'
import KanbanCard from './KanbanCard'
import type { Lead, LeadEtapa } from '@/types'
import { PIPE_ETAPAS } from '@/lib/utils'

interface KanbanBoardProps {
  leads: Lead[]
  onMoveCard: (leadId: string, newEtapa: LeadEtapa) => void
  onEditCard: (lead: Lead) => void
  onDeleteCard: (lead: Lead) => void
}

export default function KanbanBoard({ leads, onMoveCard, onEditCard, onDeleteCard }: KanbanBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const activeLead = activeId ? leads.find(l => l.id === activeId) : null

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over) return
    const leadId = String(active.id)
    const overId = String(over.id)

    // overId é o id da coluna (etapa) ou de outro card
    const lead = leads.find(l => l.id === leadId)
    if (!lead) return

    // Verificar se dropou em coluna
    const etapa = PIPE_ETAPAS.find(e => e === overId)
    if (etapa && etapa !== lead.etapa) {
      onMoveCard(leadId, etapa)
      return
    }

    // Dropou em cima de outro card — mover para a mesma etapa
    const overLead = leads.find(l => l.id === overId)
    if (overLead && overLead.etapa !== lead.etapa) {
      onMoveCard(leadId, overLead.etapa)
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="kanban">
        {PIPE_ETAPAS.map(etapa => (
          <KanbanColumn
            key={etapa}
            etapa={etapa}
            leads={leads.filter(l => l.etapa === etapa)}
            onEditCard={onEditCard}
            onDeleteCard={onDeleteCard}
          />
        ))}
      </div>

      <DragOverlay>
        {activeLead ? (
          <KanbanCard
            lead={activeLead}
            isDragging
            onEdit={() => {}}
            onDelete={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
