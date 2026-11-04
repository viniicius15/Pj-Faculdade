const RegraNegocioError = require('../errors/RegraNegocioError');

/**
 * Controller: responsável apenas pela comunicação HTTP.
 * Recebe a requisição, delega para o Service e monta a resposta.
 * Não contém regra de negócio.
 */
class ChamadoController {
  constructor(chamadoService) {
    this.chamadoService = chamadoService;

    // O Express chama os métodos como funções soltas, o que perderia a referência
    // de "this". O bind garante que o Controller continue acessível dentro deles.
    this.abrir = this.abrir.bind(this);
    this.listar = this.listar.bind(this);
    this.buscarPorId = this.buscarPorId.bind(this);
  }

  /** POST /chamados */
  async abrir(req, res) {
    try {
      const chamadoCriado = await this.chamadoService.abrirChamado(req.body);
      return res.status(201).json(chamadoCriado);
    } catch (erro) {
      return this.#responderErro(erro, res);
    }
  }

  /** GET /chamados (aceita ?prioridade=ALTA) */
  async listar(req, res) {
    try {
      const chamados = await this.chamadoService.listarChamados(req.query.prioridade);
      return res.status(200).json(chamados);
    } catch (erro) {
      return this.#responderErro(erro, res);
    }
  }

  /** GET /chamados/:id */
  async buscarPorId(req, res) {
    try {
      const chamado = await this.chamadoService.buscarChamadoPorId(req.params.id);

      if (!chamado) {
        return res.status(404).json({ erro: 'Chamado não encontrado.' });
      }

      return res.status(200).json(chamado);
    } catch (erro) {
      return this.#responderErro(erro, res);
    }
  }

  /** Converte um erro de negócio em HTTP 400 e erros inesperados em HTTP 500. */
  #responderErro(erro, res) {
    if (erro instanceof RegraNegocioError) {
      return res.status(400).json({ erro: erro.message });
    }

    console.error(erro);
    return res.status(500).json({ erro: 'Erro interno do servidor.' });
  }
}

module.exports = ChamadoController;
