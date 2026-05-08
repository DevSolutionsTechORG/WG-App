import type { Access, CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

const isRequesterOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { requestedBy: { equals: user.id } }
}

export const ShoppingItems: CollectionConfig = {
  slug: 'shopping-items',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'priority', 'status', 'requestedBy'],
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: authenticated,
    delete: isRequesterOrAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Artikel',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Details / Notizen',
    },
    {
      name: 'category',
      type: 'select',
      required: true,
      label: 'Kategorie',
      options: [
        { label: 'Reinigung', value: 'cleaning' },
        { label: 'Lebensmittel', value: 'food' },
        { label: 'Sonstiges', value: 'other' },
      ],
      defaultValue: 'food',
    },
    {
      name: 'priority',
      type: 'select',
      required: true,
      label: 'Priorität',
      options: [
        { label: 'Hoch', value: 'high' },
        { label: 'Mittel', value: 'medium' },
        { label: 'Niedrig', value: 'low' },
      ],
      defaultValue: 'medium',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      label: 'Status',
      options: [
        { label: 'Offen', value: 'open' },
        { label: 'Erledigt', value: 'completed' },
        { label: 'Abgelehnt', value: 'rejected' },
      ],
      defaultValue: 'open',
    },
    {
      name: 'requestedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Gewünscht von',
    },
    {
      name: 'completedBy',
      type: 'relationship',
      relationTo: 'users',
      label: 'Gekauft von',
      admin: {
        description: 'Wer hat diesen Artikel gekauft',
      },
    },
    {
      name: 'completedAt',
      type: 'date',
      label: 'Gekauft am',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'quantity',
      type: 'number',
      label: 'Menge',
      defaultValue: 1,
      admin: {
        description: 'Optional: Anzahl oder Menge',
      },
    },
    {
      name: 'unit',
      type: 'text',
      label: 'Einheit',
      admin: {
        description: 'z.B. Stück, Packung, kg, Liter',
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && !data.requestedBy) {
          // Auto-set current user as requester
          data.requestedBy = req.user?.id
        }
        return data
      },
    ],
  },
}
