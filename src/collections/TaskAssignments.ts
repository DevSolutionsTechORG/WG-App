import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

export const TaskAssignments: CollectionConfig = {
  slug: 'task-assignments',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['template', 'assignedTo', 'weekNumber', 'year', 'status'],
  },
  access: {
    read: authenticated,
    create: ({ req: { user } }) => user?.role === 'admin',
    update: authenticated,
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'task-templates',
      required: true,
      label: 'Task-Template',
    },
    {
      name: 'assignedTo',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Zugewiesen an',
    },
    {
      name: 'weekNumber',
      type: 'number',
      required: true,
      label: 'Kalenderwoche',
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      label: 'Jahr',
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      label: 'Status',
      options: [
        { label: 'Ausstehend', value: 'pending' },
        { label: 'Erledigt', value: 'completed' },
        { label: 'Übersprungen', value: 'skipped' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'dueDate',
      type: 'date',
      label: 'Fälligkeitsdatum',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
    },
    {
      name: 'notes',
      type: 'textarea',
      label: 'Notizen',
    },
    {
      name: 'title',
      type: 'text',
      label: 'Titel (Auto-Generated)',
      admin: {
        readOnly: true,
      },
      hooks: {
        beforeChange: [
          async ({ data, req }) => {
            if (!data?.template || !data?.weekNumber || !data?.year) {
              return 'Unbekannte Zuweisung'
            }
            const template = await req.payload.findByID({
              collection: 'task-templates',
              id: data.template,
            })
            return `${template?.title || 'Unbekannt'} - KW${data.weekNumber}/${data.year}`
          },
        ],
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (operation === 'create' && data) {
          // Check if assignment already exists for this week
          const existing = await req.payload.find({
            collection: 'task-assignments',
            where: {
              template: { equals: data.template },
              weekNumber: { equals: data.weekNumber },
              year: { equals: data.year },
            },
            limit: 1,
          })

          if (existing.docs.length > 0) {
            throw new Error('Assignment already exists for this week')
          }
        }
        return data
      },
    ],
  },
}
