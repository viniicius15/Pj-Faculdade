const request = require('supertest');
const criarApp = require('../src/app');

const chamadoValido = {
  titulo: 'Impressora sem papel',
  descricao: 'A impressora do setor financeiro parou de imprimir.',
  solicitante: 'Ana Souza',
  setor: 'Financeiro',
  prioridade: 'ALTA',
};

let app;

// Um app novo antes de cada teste cria um repositório em memória vazio.
// Isso garante que os testes sejam independentes e não dependam da ordem de execução.
beforeEach(() => {
  app = criarApp();
});

describe('POST /chamados', () => {
  test('cadastro válido: cria o chamado e retorna 201 com id', async () => {
    const resposta = await request(app).post('/chamados').send(chamadoValido);

    expect(resposta.status).toBe(201);
    expect(resposta.body).toHaveProperty('id');
    expect(resposta.body.titulo).toBe(chamadoValido.titulo);
    expect(resposta.body.prioridade).toBe('ALTA');
    expect(resposta.body.status).toBe('ABERTO');
  });

  test('cadastro inválido: retorna 400 quando a descrição é curta (RN1)', async () => {
    const resposta = await request(app)
      .post('/chamados')
      .send({ ...chamadoValido, descricao: 'curta' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/10 caracteres/);
  });

  test('cadastro inválido: retorna 400 quando a prioridade é inválida (RN2)', async () => {
    const resposta = await request(app)
      .post('/chamados')
      .send({ ...chamadoValido, prioridade: 'URGENTE' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/prioridade/i);
  });

  test('cadastro inválido: retorna 400 quando falta um campo obrigatório', async () => {
    const { titulo, ...semTitulo } = chamadoValido;
    const resposta = await request(app).post('/chamados').send(semTitulo);

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/titulo/);
  });
});

describe('GET /chamados', () => {
  test('consulta: retorna 200 e a lista com os chamados cadastrados', async () => {
    await request(app).post('/chamados').send(chamadoValido);

    const resposta = await request(app).get('/chamados');

    expect(resposta.status).toBe(200);
    expect(Array.isArray(resposta.body)).toBe(true);
    expect(resposta.body).toHaveLength(1);
    expect(resposta.body[0].titulo).toBe(chamadoValido.titulo);
  });

  test('consulta: retorna lista vazia quando não há chamados', async () => {
    const resposta = await request(app).get('/chamados');

    expect(resposta.status).toBe(200);
    expect(resposta.body).toEqual([]);
  });

  test('consulta por id: retorna 404 quando o chamado não existe', async () => {
    const resposta = await request(app).get('/chamados/nao-existe');

    expect(resposta.status).toBe(404);
  });
});
