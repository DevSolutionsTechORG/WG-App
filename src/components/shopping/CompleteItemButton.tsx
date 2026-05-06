'use client'

import { useState } from 'react'
import { Check } from 'lucide-react'

import { completeShoppingItem } from '@/lib/shopping/actions'

interface CompleteItemButtonProps {
  itemId: string
}

export function CompleteItemButton({ itemId }: CompleteItemButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleComplete = async () => {
    setIsPending(true)
    try {
      const result = await completeShoppingItem(itemId)
      if (result.success) {
        window.location.reload()
      } else {
        alert(result.message)
      }
    } catch {
      alert('Fehler beim Abschließen')
    } finally {
      setIsPending(false)
    }
  }

  return (
    <button
      onClick={handleComplete}
      disabled={isPending}
      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 text-sm"
    >
      <Check className="w-4 h-4" />
      {isPending ? '...' : 'Gekauft'}
    </button>
  )
}
