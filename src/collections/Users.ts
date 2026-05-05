import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
  },
  auth: {
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    },
    tokenExpiration: 900, // 15 minutes
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Name',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'Avatar',
      required: false,
    },
    {
      name: 'role',
      type: 'select',
      options: [
        { label: 'Member', value: 'member' },
        { label: 'Admin', value: 'admin' },
      ],
      defaultValue: 'member',
      required: true,
      label: 'Role',
    },
  ],
}
