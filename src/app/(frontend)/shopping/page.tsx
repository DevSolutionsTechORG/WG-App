import { CheckCircle2, Circle, Package, Plus, ShoppingCart, Trash2, Undo2 } from 'lucide-react'
import { getCategoryCounts, getShoppingItems } from '@/lib/shopping/actions'

import { AddItemForm } from '@/components/shopping/AddItemForm'
import { CategoryFilter } from '@/components/shopping/CategoryFilter'
import { CompleteItemButton } from '@/components/shopping/CompleteItemButton'
import Link from 'next/link'
import { ReopenItemButton } from '@/components/shopping/ReopenItemButton'
import config from '@/payload.config'
import { headers as getHeaders } from 'next/headers.js'
import { getPayload } from 'payload'
import { redirect } from 'next/navigation'

const categoryLabels: Record<string, string> = {
  cleaning: 'Reinigung',
  food: 'Lebensmittel',
  other: 'Sonstiges',
}

const priorityColors: Record<string, string> = {
  high: 'text-red-500 bg-red-50',
  medium: 'text-yellow-500 bg-yellow-50',
  low: 'text-green-500 bg-green-50',
}

const priorityLabels: Record<string, string> = {
  high: 'Hoch',
  medium: 'Mittel',
  low: 'Niedrig',
}

export default async function ShoppingPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; status?: string }>
}) {
  const headers = await getHeaders()
  const payloadConfig = await config
  const payload = await getPayload({ config: payloadConfig })
  const { user } = await payload.auth({ headers })

  if (!user) {
    redirect('/login')
  }

  const params = await searchParams
  const category = params.category || 'all'
  const status = params.status || 'open'

  const [{ items }, { counts }] = await Promise.all([
    getShoppingItems(category, status),
    getCategoryCounts(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">Einkaufsliste</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShoppingCart className="w-4 h-4" />
            <span>{counts?.all || 0} offene Artikel</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: Add form and filters */}
          <div className="lg:col-span-1 space-y-6">
            <AddItemForm />
            <CategoryFilter currentCategory={category} counts={counts || {}} />
          </div>

          {/* Right column: Items list */}
          <div className="lg:col-span-2">
            {/* Status filter tabs */}
            <div className="flex gap-2 mb-6">
              <Link
                href={`/shopping?category=${category}&status=open`}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  status === 'open'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Offen
              </Link>
              <Link
                href={`/shopping?category=${category}&status=completed`}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  status === 'completed'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Erledigt
              </Link>
              <Link
                href={`/shopping?category=${category}&status=all`}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  status === 'all'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                }`}
              >
                Alle
              </Link>
            </div>

            {items.length === 0 ? (
              <div className="bg-card rounded-lg shadow border p-8 text-center">
                <Package className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {status === 'completed'
                    ? 'Keine erledigten Artikel'
                    : category !== 'all'
                      ? `Keine offenen Artikel in ${categoryLabels[category]}`
                      : 'Die Einkaufsliste ist leer'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => {
                  const isCompleted = item.status === 'completed'
                  const requestedBy = item.requestedBy as { name?: string; email?: string }
                  const completedBy = item.completedBy as
                    | { name?: string; email?: string }
                    | undefined

                  return (
                    <div
                      key={item.id}
                      className={`bg-card rounded-lg shadow border p-4 flex items-start justify-between ${
                        isCompleted ? 'opacity-60' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 shrink-0" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`font-medium ${isCompleted ? 'line-through' : ''}`}>
                              {item.title}
                            </h3>
                            <span
                              className={`text-xs px-2 py-0.5 rounded-full ${
                                priorityColors[item.priority || 'medium']
                              }`}
                            >
                              {priorityLabels[item.priority || 'medium']}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {categoryLabels[item.category]}
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                          )}
                          {(item.quantity || item.unit) && (
                            <p className="text-sm text-muted-foreground mt-0.5">
                              Menge: {item.quantity} {item.unit}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Gewünscht von {requestedBy?.name || requestedBy?.email}
                            {isCompleted && completedBy && (
                              <span className="text-green-600">
                                {' '}
                                • Gekauft von {completedBy.name || completedBy.email}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 ml-2">
                        {isCompleted ? (
                          <ReopenItemButton itemId={item.id} />
                        ) : (
                          <CompleteItemButton itemId={item.id} />
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
