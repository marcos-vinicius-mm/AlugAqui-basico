'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::imovel.imovel', ({ strapi }) => ({
  async update(ctx) {
    const usuario = ctx.state.user;
    if (!usuario) return ctx.unauthorized('É preciso estar logado.');

    const docId = ctx.params.id;
    const anuncios = await strapi.documents('api::anuncio.anuncio').findMany({
      filters: {
        usuario: { id: usuario.id },
        imovel: { documentId: docId },
      },
    });

    if (!anuncios?.length) {
      return ctx.forbidden('Você não pode alterar este imóvel.');
    }

    return super.update(ctx);
  },
}));
