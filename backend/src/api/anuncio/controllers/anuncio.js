'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::anuncio.anuncio', ({ strapi }) => ({
  async find(ctx) {
    const usuario = ctx.state.user;
    const meus = ctx.request.header['x-meus-anuncios'] === '1';

    if (meus) {
      if (!usuario) return ctx.unauthorized('É preciso estar logado.');

      const documentos = await strapi.documents('api::anuncio.anuncio').findMany({
        filters: { usuario: { id: usuario.id } },
        populate: ['imovel', 'imagens'],
        sort: 'createdAt:desc',
      });

      const sanitized = await this.sanitizeOutput(documentos, ctx);
      return this.transformResponse(sanitized);
    }

    return super.find(ctx);
  },

  async findOne(ctx) {
    const docId = ctx.params.id;
    const documento = await strapi.documents('api::anuncio.anuncio').findOne({
      documentId: docId,
      populate: ['imovel', 'imagens'],
    });

    if (!documento) return ctx.notFound();

    const sanitized = await this.sanitizeOutput(documento, ctx);
    return this.transformResponse(sanitized);
  },

  async create(ctx) {
    const usuario = ctx.state.user;
    if (!usuario) return ctx.unauthorized('É preciso estar logado.');

    const { data } = ctx.request.body;

    const document = await strapi.documents('api::anuncio.anuncio').create({
      data: {
        ...data,
        usuario: usuario.documentId,
      },
      status: ctx.query.status === 'published' ? 'published' : 'draft',
    });

    const sanitized = await this.sanitizeOutput(document, ctx);
    return this.transformResponse(sanitized);
  },

  async update(ctx) {
    const usuario = ctx.state.user;
    if (!usuario) return ctx.unauthorized('É preciso estar logado.');

    const docId = ctx.params.id;
    const existente = await strapi.documents('api::anuncio.anuncio').findOne({
      documentId: docId,
      populate: ['usuario'],
    });

    if (!existente) return ctx.notFound();
    if (existente.usuario?.id !== usuario.id) {
      return ctx.forbidden('Você só pode editar seus próprios anúncios.');
    }

    const { data } = ctx.request.body;
    delete data.usuario;

    const document = await strapi.documents('api::anuncio.anuncio').update({
      documentId: docId,
      data,
      status: ctx.query.status === 'published' ? 'published' : 'draft',
    });

    const sanitized = await this.sanitizeOutput(document, ctx);
    return this.transformResponse(sanitized);
  },

  async delete(ctx) {
    const usuario = ctx.state.user;
    if (!usuario) return ctx.unauthorized('É preciso estar logado.');

    const docId = ctx.params.id;
    const existente = await strapi.documents('api::anuncio.anuncio').findOne({
      documentId: docId,
      populate: ['usuario', 'imovel'],
    });

    if (!existente) return ctx.notFound();
    if (existente.usuario?.id !== usuario.id) {
      return ctx.forbidden('Você só pode excluir seus próprios anúncios.');
    }

    const imovelId = existente.imovel?.documentId;

    await strapi.documents('api::anuncio.anuncio').delete({ documentId: docId });

    if (imovelId) {
      await strapi.documents('api::imovel.imovel').delete({ documentId: imovelId });
    }

    return this.transformResponse(existente);
  },
}));
