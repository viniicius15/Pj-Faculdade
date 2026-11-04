const criarApp = require('./app');
const criarPool = require('./database/pool');
const ChamadoRepositoryPostgres = require('./repositories/ChamadoRepositoryPostgres');

const PORT = process.env.PORT || 3000;

/**
 * Sobe a aplicação usando o PostgreSQL como armazenamento.
 *
 * Repare que só este arquivo (e o app.js) mudou por causa do banco:
 * o Service e o Controller continuam exatamente iguais.
 */
async function iniciar() {
  const pool = criarPool();
  const chamadoRepository = new ChamadoRepositoryPostgres(pool);

  // Garante que a tabela exista antes de aceitar requisições.
  await chamadoRepository.criarTabela();

  const app = criarApp(chamadoRepository);

  app.listen(PORT, () => {
    console.log(`HelpTech API rodando em http://localhost:${PORT} (PostgreSQL)`);
  });
}

iniciar().catch((erro) => {
  console.error('Falha ao iniciar a aplicação:', erro.message);
  process.exit(1);
});
