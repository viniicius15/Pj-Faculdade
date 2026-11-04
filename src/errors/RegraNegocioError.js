/**
 * Erro de domínio: representa a violação de uma regra de negócio.
 * Esta classe não conhece HTTP. Quem traduz o erro para o status 400 é o Controller,
 * o que mantém a regra de negócio independente da camada web.
 */
class RegraNegocioError extends Error {
  constructor(mensagem) {
    super(mensagem);
    this.name = 'RegraNegocioError';
  }
}

module.exports = RegraNegocioError;
