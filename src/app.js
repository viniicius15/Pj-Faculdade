const express = require('express');

const ChamadoRepositoryMemory = require('./repositories/ChamadoRepositoryMemory');
const ChamadoService = require('./services/ChamadoService');
const ChamadoController = require('./controllers/ChamadoController');

/**
 * Monta a aplicação Express e injeta as dependências.
 *
 * Este arquivo NÃO chama app.listen(): apenas devolve o app configurado.
 * Com isso, os testes podem usar o Supertest sem abrir porta de rede.
 *
 * O repositório pode ser passado como parâmetro. Se ninguém passar nada,
 * usamos o repositório em memória (é o que os testes fazem, para rodar rápido
 * e sem depender de banco de dados).
 *
 * É aqui que escolhemos a implementação concreta. Trocar memória por PostgreSQL
 * não exige alterar o Service nem o Controller: os dois só conhecem o contrato
 * IChamadoRepository. Esse é o DIP na prática.
 */
function criarApp(chamadoRepository = new ChamadoRepositoryMemory()) {
  const app = express();
  app.use(express.json());

  const chamadoService = new ChamadoService(chamadoRepository);
  const chamadoController = new ChamadoController(chamadoService);

  app.post('/chamados', chamadoController.abrir);
  app.get('/chamados', chamadoController.listar);
  app.get('/chamados/:id', chamadoController.buscarPorId);

  // Usado para verificar rapidamente se a aplicação está de pé (útil no Docker).
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

  return app;
}

module.exports = criarApp;
