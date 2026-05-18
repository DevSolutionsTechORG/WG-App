import type { Access, CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

const isOwnerOrAdmin: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { createdBy: { equals: user.id } }
}

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'startDate', 'endDate', 'allDay', 'createdBy'],
  },
  access: {
    read: authenticated,
    create: authenticated,
    update: isOwnerOrAdmin,
    delete: isOwnerOrAdmin,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titel',
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Beschreibung',
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
      label: 'Start',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'Ende',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
        description: 'Optional: Endzeitpunkt (falls nicht gesetzt = Startzeitpunkt)',
      },
    },
    {
      name: 'allDay',
      type: 'checkbox',
      label: 'Ganztägig',
      defaultValue: false,
    },
    {
      name: 'location',
      type: 'text',
      label: 'Ort',
    },
    {
      name: 'eventType',
      type: 'select',
      label: 'Typ',
      options: [
        { label: 'WG-Treffen', value: 'wg-meeting' },
        { label: 'Party', value: 'party' },
        { label: 'Reinigung', value: 'cleaning' },
        { label: 'Abfallentsorgung', value: 'waste-collection' },
        { label: 'Sonstiges', value: 'other' },
      ],
      defaultValue: 'other',
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Erstellt von',
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && !data.createdBy) {
          data.createdBy = req.user?.id
        }
        // If no endDate, set it to startDate
        if (!data.endDate && data.startDate) {
          data.endDate = data.startDate
        }
        return data
      },
    ],
  },
}
