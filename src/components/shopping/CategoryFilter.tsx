'use client'

import { Check, Filter } from 'lucide-react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

const categories = [
  { id: 'all', label: 'Alle', icon: Filter },
  { id: 'food', label: 'Lebensmittel' },
  { id: 'cleaning', label: 'Reinigung' },
  { id: 'other', label: 'Sonstiges' },
]

interface CategoryFilterProps {
  currentCategory: string
  counts: Record<string, number>
}

export function CategoryFilter({ currentCategory, counts }: CategoryFilterProps) {
  const searchParams = useSearchParams()
  const currentStatus = searchParams.get('status') || 'open'

  return (
    <div className="bg-card rounded-lg shadow border p-4">
      <h3 className="font-medium mb-3">Kategorien</h3>
      <div className="space-y-1">
        {categories.map((category) => {
          const isActive = currentCategory === category.id
          const count = counts[category.id] || 0

          return (
            <Link
              key={category.id}
              href={`/shopping?category=${category.id}&status=${currentStatus}`}
              className={`flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors ${
                isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
              }`}
            >
              <span>{category.label}</span>
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs ${
                    isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'
                  }`}
                >
                  {count}
                </span>
                {isActive && <Check className="w-4 h-4" />}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
