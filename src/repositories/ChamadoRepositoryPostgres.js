const IChamadoRepository = require('./IChamadoRepository');

/** Formato de UUID aceito pela coluna "id" da tabela. */
const REGEX_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Repository: implementacao do contrato IChamadoRepository usando PostgreSQL.
 *
 * Mesma interface da versao em memoria (criar, listarTodos, buscarPorId).
 * Por isso o ChamadoService funciona com as duas sem saber qual esta por baixo.
 * E exatamente isso que o DIP (Dependency Inversion) permite.
 *
 * Diferenca importante: aqui os metodos sao "async", pois o banco responde
 * de forma assincrona (o programa continua rodando enquanto espera a resposta).
 */
class ChamadoRepositoryPostgres extends IChamadoRepository {
  constructor(pool) {
    super();
    this.pool = pool;
  }

  /**
   * Cria a tabela caso ela ainda nao exista.
   * Executado uma vez na inicializacao, antes de o servidor aceitar requisicoes.
   */
  async criarTabela() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS chamados (
        id          UUID PRIMARY KEY,
        titulo      VARCHAR(100) NOT NULL,
        descricao   TEXT         NOT NULL,
        solicitante VARCHAR(100) NOT NULL,
        setor       VARCHAR(100) NOT NULL,
        prioridade  VARCHAR(10)  NOT NULL,
        status      VARCHAR(20)  NOT NULL,
        criado_em   TIMESTAMPTZ  NOT NULL
      );
    `);
  }

  async criar(chamado) {
    const sql = `
      INSERT INTO chamados
        (id, titulo, descricao, solicitante, setor, prioridade, status, criado_em)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
    `;

    const valores = [
      chamado.id,
      chamado.titulo,
      chamado.descricao,
      chamado.solicitante,
      chamado.setor,
      chamado.prioridade,
      chamado.status,
      chamado.criadoEm,
    ];

    await this.pool.query(sql, valores);
    return chamado;
  }

  async listarTodos() {
    const { rows } = await this.pool.query(
      'SELECT * FROM chamados ORDER BY criado_em;'
    );
    return rows.map(ChamadoRepositoryPostgres.#linhaParaChamado);
  }

  async buscarPorId(id) {
    // Se o texto recebido nem parece um UUID, o Postgres lancaria erro de tipo.
    // Melhor devolver "nao encontrado" (undefined), que o Controller converte em 404.
    if (!REGEX_UUID.test(String(id))) {
      return undefined;
    }

    const { rows } = await this.pool.query(
      'SELECT * FROM chamados WHERE id = $1;',
      [id]
    );

    return rows[0] ? ChamadoRepositoryPostgres.#linhaParaChamado(rows[0]) : undefined;
  }

  /** Converte uma linha do banco (snake_case) para o formato da API (camelCase). */
  static #linhaParaChamado(linha) {
    return {
      id: linha.id,
      titulo: linha.titulo,
      descricao: linha.descricao,
      solicitante: linha.solicitante,
      setor: linha.setor,
      prioridade: linha.prioridade,
      status: linha.status,
      criadoEm: new Date(linha.criado_em).toISOString(),
    };
  }
}

module.exports = ChamadoRepositoryPostgres;
