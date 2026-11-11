'use strict';

const ACOES_AUTENTICADO = [
  'api::imovel.imovel.create',
  'api::imovel.imovel.find',
  'api::imovel.imovel.findOne',
  'api::imovel.imovel.update',
  'api::imovel.imovel.delete',
  'api::anuncio.anuncio.create',
  'api::anuncio.anuncio.find',
  'api::anuncio.anuncio.findOne',
  'api::anuncio.anuncio.update',
  'api::anuncio.anuncio.delete',
  'plugin::upload.content-api.upload',
];

const ACOES_PUBLICO = [
  'api::anuncio.anuncio.find',
  'api::anuncio.anuncio.findOne',
  'api::imovel.imovel.findOne',
];

async function garantirPermissoes(strapi, tipoRole, acoes) {
  const role = await strapi.db.query('plugin::users-permissions.role').findOne({
    where: { type: tipoRole },
  });
  if (!role) return;

  const existentes = await strapi.db.query('plugin::users-permissions.permission').findMany({
    where: { role: role.id },
  });
  const jaTem = new Set(existentes.map((p) => p.action));

  for (const action of acoes) {
    if (jaTem.has(action)) continue;
    await strapi.db.query('plugin::users-permissions.permission').create({
      data: { action, role: role.id },
    });
  }
}

module.exports = {
  register(/* { strapi } */) {},

  async bootstrap({ strapi }) {
    await garantirPermissoes(strapi, 'authenticated', ACOES_AUTENTICADO);
    await garantirPermissoes(strapi, 'public', ACOES_PUBLICO);
  },
};
