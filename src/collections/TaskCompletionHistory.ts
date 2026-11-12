import type { CollectionConfig } from 'payload'
import { authenticated } from '@/access/authenticated'

export const TaskCompletionHistory: CollectionConfig = {
  slug: 'task-completion-history',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['assignment', 'completedBy', 'completedAt', 'weekNumber'],
  },
  access: {
    read: authenticated,
    // Einträge entstehen nur über completeTask (overrideAccess), nie direkt per REST.
    create: ({ req: { user } }) => user?.role === 'admin',
    update: ({ req: { user } }) => user?.role === 'admin',
    delete: ({ req: { user } }) => user?.role === 'admin',
  },
  fields: [
    {
      name: 'assignment',
      type: 'relationship',
      relationTo: 'task-assignments',
      required: true,
      label: 'Zuweisung',
    },
    {
      name: 'template',
      type: 'relationship',
      relationTo: 'task-templates',
      required: true,
      label: 'Task-Template',
    },
    {
      name: 'completedBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'Erledigt von',
    },
    {
      name: 'completedAt',
      type: 'date',
      required: true,
      label: 'Erledigt am',
      defaultValue: () => new Date().toISOString(),
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
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
      name: 'notes',
      type: 'textarea',
      label: 'Notizen',
      admin: {
        description: 'Was wurde konkret gemacht (besonders für "Anderes")',
      },
    },
    {
      name: 'selectedOption',
      type: 'text',
      label: 'Gewählte Option',
      admin: {
        description: 'Falls aus Pflegeoptionen gewählt',
      },
    },
    {
      name: 'repeatedWithinTwoWeeks',
      type: 'checkbox',
      label: 'Wiederholung innerhalb 2 Wochen',
      defaultValue: false,
      admin: {
        readOnly: true,
        description: 'Automatisch gesetzt: Aufgabe war in den letzten 14 Tagen schon erledigt',
      },
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
          async ({ data }) => {
            if (!data?.weekNumber || !data?.year) {
              return 'Erledigt (unbekannte Woche)'
            }
            return `Erledigt KW${data.weekNumber}/${data.year}`
          },
        ],
      },
    },
  ],
}
