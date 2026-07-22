// utils/sampleData.ts
import type { SampleDataset } from '~/types/json'

export const sampleDatasets: SampleDataset[] = [
  {
    id: 'user-profile',
    label: 'User profile',
    json: JSON.stringify(
      {
        id: 'usr_8f2c1a',
        name: 'Priya Nakamura',
        email: 'priya@example.com',
        isActive: true,
        roles: ['admin', 'editor'],
        lastLogin: '2026-07-18T09:32:00Z',
        address: {
          street: '221B Baker Street',
          city: 'London',
          postalCode: 'NW1 6XE',
          country: 'UK',
        },
        preferences: {
          theme: 'dark',
          notifications: { email: true, sms: false, push: true },
        },
        deletedAt: null,
      },
      null,
      2
    ),
  },
  {
    id: 'api-response',
    label: 'API response (paginated)',
    json: JSON.stringify(
      {
        status: 'ok',
        page: 2,
        perPage: 3,
        totalItems: 42,
        items: [
          { id: 101, title: 'Introduction to Nuxt 3', tags: ['vue', 'ssr'], rating: 4.8 },
          { id: 102, title: 'TypeScript Generics Deep Dive', tags: ['typescript'], rating: 4.6 },
          { id: 103, title: 'Composables in Practice', tags: ['vue', 'composition-api'], rating: 4.9 },
        ],
        links: {
          next: '/api/articles?page=3',
          prev: '/api/articles?page=1',
        },
      },
      null,
      2
    ),
  },
  {
    id: 'config',
    label: 'App config',
    json: JSON.stringify(
      {
        appName: 'json-formatter',
        version: '1.0.0',
        features: {
          treeView: true,
          minify: true,
          darkModeOnly: true,
        },
        indent: 2,
        maxFileSizeMb: 5,
        supportedExtensions: ['.json'],
      },
      null,
      2
    ),
  },
]
