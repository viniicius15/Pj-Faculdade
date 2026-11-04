const { Pool } = require('pg');

/**
 * Cria o pool de conexoes do PostgreSQL.
 *
 * Um "pool" mantem varias conexoes abertas e reaproveita cada uma entre as
 * requisicoes, em vez de abrir e fechar uma conexao a cada consulta.
 *
 * As credenciais vem de variaveis de ambiente. Os valores padrao abaixo servem
 * para rodar localmente contra o banco do docker-compose (servico "db").
 */
function criarPool() {
  return new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    user: process.env.DB_USER || 'helptech',
    password: process.env.DB_PASSWORD || 'helptech',
    database: process.env.DB_NAME || 'helptech',
  });
}

module.exports = criarPool;
