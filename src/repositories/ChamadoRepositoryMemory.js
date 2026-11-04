const IChamadoRepository = require('./IChamadoRepository');

/**
 * Repository: implementação em memória do contrato IChamadoRepository.
 * Responsabilidade única: guardar e recuperar os dados.
 *
 * Não há banco de dados: os chamados ficam em um Array enquanto a aplicação
 * estiver em execução. Ao reiniciar o servidor, a lista volta a ficar vazia.
 */
class ChamadoRepositoryMemory extends IChamadoRepository {
  constructor() {
    super();
    this.chamados = [];
  }

  criar(chamado) {
    this.chamados.push(chamado);
    return chamado;
  }

  listarTodos() {
    // Devolve uma cópia para evitar que quem chamou altere a lista interna.
    return [...this.chamados];
  }

  buscarPorId(id) {
    return this.chamados.find((chamado) => chamado.id === id);
  }
}

module.exports = ChamadoRepositoryMemory;
