const { randomUUID } = require('node:crypto');

/** Prioridades aceitas pela API. Usadas na regra de negócio RN2. */
const PRIORIDADES = Object.freeze(['BAIXA', 'MEDIA', 'ALTA']);

/**
 * Model: representa um chamado de suporte.
 * Responsabilidade única: montar o objeto com o formato correto.
 * O id, o status e a data de criação são gerados pelo próprio sistema.
 * A validação dos dados de entrada NÃO fica aqui, e sim na camada Service.
 */
class Chamado {
  constructor({ titulo, descricao, solicitante, setor, prioridade }) {
    this.id = randomUUID();
    this.titulo = titulo;
    this.descricao = descricao;
    this.solicitante = solicitante;
    this.setor = setor;
    this.prioridade = prioridade;
    this.status = 'ABERTO';
    this.criadoEm = new Date().toISOString();
  }
}

module.exports = { Chamado, PRIORIDADES };
