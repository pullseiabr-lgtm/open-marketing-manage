'use client'

import { useState } from 'react'
import TabPipeline from '@/components/funil/TabPipeline'
import TabMetricas from '@/components/funil/TabMetricas'

export default function FunilPage() {
  const [tab, setTab] = useState<'pipeline' | 'metricas'>('pipeline')

  return (
    <div>
      <div className="sec-hd">
        <div className="sec-tt">Funil Completo</div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn${tab === 'pipeline' ? ' act' : ''}`}
          onClick={() => setTab('pipeline')}
        >
          Pipeline da Apresentação
        </button>
        <button
          className={`tab-btn${tab === 'metricas' ? ' act' : ''}`}
          onClick={() => setTab('metricas')}
        >
          Performance Digital
        </button>
      </div>

      {tab === 'pipeline' ? <TabPipeline /> : <TabMetricas />}
    </div>
  )
}
