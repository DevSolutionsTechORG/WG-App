import type { Access } from 'payload'

export const authenticatedOrPublished: Access = ({ req: { user } }) => {
  if (user) {
    return true
  }

  return {
    and: [
      {
        _status: {
          equals: 'published',
        },
      },
    ],
  }
}
