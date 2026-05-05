'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import Toast from './ui/Toast'
import ConfirmDialog from './ui/ConfirmDialog'
import { SidebarProvider } from './layout/SidebarContext'

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: { staleTime: 30_000, retry: 1 },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <SidebarProvider>
        {children}
        <Toast />
        <ConfirmDialog />
      </SidebarProvider>
    </QueryClientProvider>
  )
}
