const { Chamado, PRIORIDADES } = require('../models/Chamado');
const RegraNegocioError = require('../errors/RegraNegocioError');

const TAMANHO_MINIMO_DESCRICAO = 10;

/**
 * Service: concentra as regras de negócio da aplicação.
 *
 * Recebe o repositório pelo construtor (Injeção de Dependência).
 * Isso é o DIP na prática: o Service conhece apenas o contrato
 * IChamadoRepository, nunca a implementação concreta.
 */
class ChamadoService {
  constructor(chamadoRepository) {
    this.chamadoRepository = chamadoRepository;
  }

  /**
   * Abre um novo chamado.
   * Aplica as regras de negócio antes de salvar.
   * @throws {RegraNegocioError} quando os dados violam uma regra de negócio.
   */
  async abrirChamado(dados) {
    this.#validar(dados);

    const chamado = new Chamado({
      titulo: dados.titulo.trim(),
      descricao: dados.descricao.trim(),
      solicitante: dados.solicitante.trim(),
      setor: dados.setor.trim(),
      prioridade: dados.prioridade.trim().toUpperCase(),
    });

    // O "await" funciona tanto com o repositório em memória (que responde na hora)
    // quanto com o do PostgreSQL (que responde de forma assíncrona).
    return this.chamadoRepository.criar(chamado);
  }

  /**
   * Lista os chamados. Aceita, opcionalmente, um filtro por prioridade.
   * @throws {RegraNegocioError} quando a prioridade informada é inválida.
   */
  async listarChamados(filtroPrioridade) {
    const chamados = await this.chamadoRepository.listarTodos();

    if (filtroPrioridade === undefined) {
      return chamados;
    }

    const prioridade = String(filtroPrioridade).trim().toUpperCase();

    if (!PRIORIDADES.includes(prioridade)) {
      throw new RegraNegocioError(
        `A prioridade deve ser uma das seguintes: ${PRIORIDADES.join(', ')}.`
      );
    }

    return chamados.filter((chamado) => chamado.prioridade === prioridade);
  }

  /** Busca um chamado pelo id. Retorna undefined quando não existe. */
  async buscarChamadoPorId(id) {
    return this.chamadoRepository.buscarPorId(id);
  }

  /**
   * Validações de entrada e regras de negócio.
   * Método privado (#): só pode ser chamado de dentro da própria classe.
   */
  #validar(dados) {
    const { titulo, descricao, solicitante, setor, prioridade } = dados;

    // Campos essenciais de uma solicitação de suporte.
    this.#exigirTexto(titulo, 'titulo');
    this.#exigirTexto(solicitante, 'solicitante');
    this.#exigirTexto(setor, 'setor');
    this.#exigirTexto(descricao, 'descricao');
    this.#exigirTexto(prioridade, 'prioridade');

    // RN1 - Descrição útil: evita chamados vagos do tipo "não funciona".
    if (descricao.trim().length < TAMANHO_MINIMO_DESCRICAO) {
      throw new RegraNegocioError(
        `A descrição deve ter no mínimo ${TAMANHO_MINIMO_DESCRICAO} caracteres.`
      );
    }

    // RN2 - Prioridade válida: garante que a triagem da fila faça sentido.
    if (!PRIORIDADES.includes(prioridade.trim().toUpperCase())) {
      throw new RegraNegocioError(
        `A prioridade deve ser uma das seguintes: ${PRIORIDADES.join(', ')}.`
      );
    }
  }

  /** Garante que um campo de texto exista e não esteja vazio. */
  #exigirTexto(valor, nomeCampo) {
    if (typeof valor !== 'string' || valor.trim() === '') {
      throw new RegraNegocioError(`O campo "${nomeCampo}" é obrigatório.`);
    }
  }
}

module.exports = ChamadoService;
