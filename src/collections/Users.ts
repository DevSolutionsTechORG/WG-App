import type { Access, CollectionConfig } from 'payload'

const isAdmin: Access = ({ req }) => req.user?.role === 'admin'

const isAdminOrSelf: Access = ({ req, id }) => {
  if (!req.user) return false
  if (req.user.role === 'admin') return true
  return req.user.id === id
}

const isAuthenticated: Access = ({ req }) => Boolean(req.user)

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: isAuthenticated,
    create: isAdmin,
    update: isAdminOrSelf,
    delete: isAdmin,
    admin: ({ req }) => req.user?.role === 'admin',
  },
  auth: {
    cookies: {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    },
    tokenExpiration: 900,
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    forgotPassword: {
      expiration: 60 * 60 * 1000,
    },
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
      access: {
        update: ({ req }) => req.user?.role === 'admin',
      },
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
