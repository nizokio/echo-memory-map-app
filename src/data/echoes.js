export const echoes = [
  {
    id: 'echo-orange-cat',
    userId: 'user-vanessa',
    location: {
      latitude: 40.6912,
      longitude: -73.9915,
      name: 'Brooklyn Heights Cafe',
      locality: 'Brooklyn Heights, New York',
    },
    note: 'The orange cat slept in the window while it rained. Come back for the cardamom latte.',
    capturedAt: '2026-05-12T09:24:00.000Z',
    createdAt: '2026-05-12T09:24:00.000Z',
    updatedAt: '2026-05-12T09:24:00.000Z',
    tags: ['coffee', 'revisit', 'rainy-day'],
    photos: [
      {
        id: 'photo-orange-cat-1',
        uri: 'https://picsum.photos/seed/orange-cat-cafe/600/800',
        width: 600,
        height: 800,
        sortOrder: 0,
        capturedAt: '2026-05-12T09:24:00.000Z',
        caption: 'An orange cat resting in a cafe window beside a rainy street.',
      },
      {
        id: 'photo-orange-cat-2',
        uri: 'https://picsum.photos/seed/cardamom-latte/600/800',
        width: 600,
        height: 800,
        sortOrder: 1,
        capturedAt: '2026-05-12T09:31:00.000Z',
        caption: 'A cardamom latte on a small marble table.',
      },
    ],
    aiMetadata: {
      title: 'The cafe with the orange cat',
      summary: 'A rainy morning at a quiet Brooklyn cafe with an unforgettable window cat and cardamom latte.',
      caption: 'A cozy cafe memory with rain, coffee, and an orange cat.',
    },
  },
  {
    id: 'echo-sunset-bridge',
    userId: 'user-vanessa',
    location: {
      latitude: 40.697,
      longitude: -73.993,
      name: 'Brooklyn Bridge Park',
      locality: 'Brooklyn, New York',
    },
    note: 'Stayed until the whole sky turned peach. The bridge lights came on just after this.',
    capturedAt: '2026-05-08T19:42:00.000Z',
    createdAt: '2026-05-08T19:42:00.000Z',
    updatedAt: '2026-05-08T19:42:00.000Z',
    tags: ['sunset', 'water', 'favorite'],
    photos: [{
      id: 'photo-sunset-1',
      uri: 'https://picsum.photos/seed/brooklyn-sunset/600/800',
      width: 600,
      height: 800,
      sortOrder: 0,
      capturedAt: '2026-05-08T19:42:00.000Z',
      caption: 'A peach sunset over the East River and Brooklyn Bridge.',
    }],
    aiMetadata: {
      title: 'Peach sky by the bridge',
      summary: 'An unplanned sunset walk at Brooklyn Bridge Park.',
      caption: 'A warm sunset settling behind the Brooklyn Bridge.',
    },
  },
  {
    id: 'echo-library',
    userId: 'user-vanessa',
    location: {
      latitude: 40.689,
      longitude: -73.987,
      name: 'Court Street Library',
      locality: 'Downtown Brooklyn, New York',
    },
    note: 'Found the little reading alcove at the back. It was silent except for the radiator.',
    capturedAt: '2026-04-28T15:10:00.000Z',
    createdAt: '2026-04-28T15:10:00.000Z',
    updatedAt: '2026-04-28T15:10:00.000Z',
    tags: ['reading', 'quiet', 'revisit'],
    photos: [{
      id: 'photo-library-1',
      uri: 'https://picsum.photos/seed/quiet-library/600/800',
      width: 600,
      height: 800,
      sortOrder: 0,
      capturedAt: '2026-04-28T15:10:00.000Z',
      caption: 'A warm reading alcove between library shelves.',
    }],
    aiMetadata: {
      title: 'The quiet library corner',
      summary: 'A hidden reading nook worth returning to on a slow afternoon.',
      caption: 'A tucked-away library corner with warm light and tall shelves.',
    },
  },
  {
    id: 'echo-garden-path',
    userId: 'user-vanessa',
    location: {
      latitude: 40.6945,
      longitude: -73.985,
      name: 'MetroTech Garden',
      locality: 'Downtown Brooklyn, New York',
    },
    note: 'A tiny garden path behind the office buildings. Felt like finding a shortcut into another day.',
    capturedAt: '2026-04-19T12:18:00.000Z',
    createdAt: '2026-04-19T12:18:00.000Z',
    updatedAt: '2026-04-19T12:18:00.000Z',
    tags: ['garden', 'quiet', 'walk'],
    photos: [{
      id: 'photo-garden-1',
      uri: 'https://picsum.photos/seed/secret-garden-path/600/800',
      width: 600,
      height: 800,
      sortOrder: 0,
      capturedAt: '2026-04-19T12:18:00.000Z',
      caption: 'A leafy garden path hidden among city buildings.',
    }],
    aiMetadata: {
      title: 'The hidden garden path',
      summary: 'A surprising pocket of green in the middle of downtown Brooklyn.',
      caption: 'A leafy path tucked behind a row of city buildings.',
    },
  },
];

export const getRelatedEchoes = (echo) =>
  echoes.filter(
    (candidate) =>
      candidate.id !== echo.id &&
      candidate.tags.some((tag) => echo.tags.includes(tag))
  );
