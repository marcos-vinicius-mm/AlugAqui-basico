module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://127.0.0.1:8080', 'http://localhost:8080', 'http://127.0.0.1:5500', 'http://localhost:5500'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept', 'X-Meus-Anuncios'],
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
