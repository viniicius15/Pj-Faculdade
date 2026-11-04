/**
 * Contrato (abstração) do repositório de chamados.
 *
 * Este é o coração do princípio SOLID aplicado: Dependency Inversion (DIP).
 * O ChamadoService depende DESTA abstração, e não de uma classe concreta.
 * Assim, trocar o armazenamento (memória -> banco de dados) não exige
 * alterar nenhuma linha da regra de negócio.
 *
 * Como o JavaScript não possui interfaces nativas, usamos uma classe base
 * cujos métodos lançam erro caso não sejam sobrescritos pela implementação.
 */
class IChamadoRepository {
  criar() {
    throw new Error('IChamadoRepository.criar() deve ser implementado pela classe concreta.');
  }

  listarTodos() {
    throw new Error('IChamadoRepository.listarTodos() deve ser implementado pela classe concreta.');
  }

  buscarPorId() {
    throw new Error('IChamadoRepository.buscarPorId() deve ser implementado pela classe concreta.');
  }
}

module.exports = IChamadoRepository;
