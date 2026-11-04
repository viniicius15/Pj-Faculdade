# HelpTech API

API REST para abertura e consulta de **chamados de suporte de TI**.

Projeto Integrador — Ciência da Computação (FACAPE).

---

## 1. Descrição do problema

O setor de TI de uma pequena empresa recebe pedidos de suporte por canais informais
(WhatsApp, e-mail, pedido verbal). Sem um registro padronizado, não se sabe quantos
chamados existem, qual a prioridade real de cada um nem quem solicitou. O resultado é
pedido esquecido, sem triagem e sem histórico.

Esta API resolve isso permitindo **abrir** e **consultar** chamados, garantindo que todo
chamado tenha **descrição útil** e **prioridade válida**, para que a fila de atendimento
faça sentido.

## 2. Tecnologias

- **Node.js** + **Express** — servidor HTTP e definição das rotas.
- **PostgreSQL 16** + driver **pg** — persistência dos chamados.
- **Jest** + **Supertest** — testes automatizados de integração sobre as rotas.
- **Docker / Docker Compose** — execução isolada da API e do banco.
- **Git / GitHub** — versionamento.

A aplicação possui **duas implementações de repositório**: uma em **memória** (Array) e
uma em **PostgreSQL**. As duas seguem o mesmo contrato, então a regra de negócio funciona
igual nas duas. Os testes usam a versão em memória (rápida, sem depender de banco).

## 3. Estrutura do projeto

```
src/
├── models/Chamado.js                      # formato dos dados do chamado
├── repositories/
│   ├── IChamadoRepository.js              # contrato (abstração)
│   ├── ChamadoRepositoryMemory.js         # implementação em memória (Array)
│   └── ChamadoRepositoryPostgres.js       # implementação em PostgreSQL
├── services/ChamadoService.js             # regras de negócio (RN1 e RN2)
├── controllers/ChamadoController.js       # camada HTTP
├── errors/RegraNegocioError.js            # erro de domínio -> HTTP 400
├── database/pool.js                       # pool de conexões do PostgreSQL
├── app.js                                 # monta o Express e injeta dependências
└── server.js                              # sobe o servidor usando PostgreSQL
tests/chamados.test.js                     # testes de cadastro e consulta
docker-compose.yml                         # sobe o banco + a API
Dockerfile
```

## 4. Como rodar tudo (Docker Compose — recomendado)

Pré-requisito: Docker Desktop em execução.

```bash
docker compose up -d --build
```

Isso sobe **dois containers**: o PostgreSQL (`helptech-db`) e a API (`helptech-api`).
A API só inicia depois que o banco está realmente pronto (healthcheck + `depends_on`).

Acesse em **http://localhost:3001** (a porta 3000 do host já está ocupada por outro
container nesta máquina, então mapeamos a API na 3001 — veja a seção 12).

Comandos úteis:

```bash
docker compose ps            # status dos containers
docker compose logs -f api   # logs da API
docker compose down          # para tudo (mantém os dados)
docker compose down -v       # para tudo e APAGA os dados do banco
```

## 5. Como rodar localmente (sem Docker para a API)

Pré-requisito: Node.js 18+ (testado com Node 24) e um PostgreSQL acessível.

```bash
npm install
npm start        # produção
npm run dev      # desenvolvimento, com recarga automática
```

A API sobe em `http://localhost:3000`. Para mudar a porta: `PORT=8080 npm start`.

Se você já subiu o banco pelo Docker (`docker compose up -d db`), o `npm start` se conecta
a ele automaticamente, porque os valores padrão do [pool.js](src/database/pool.js) apontam
para `localhost:5432` com usuário/senha/banco `helptech`.

## 6. Variáveis de ambiente

| Variável | Padrão (uso local) | No Docker Compose |
| --- | --- | --- |
| `PORT` | `3000` | `3000` |
| `DB_HOST` | `localhost` | `db` (nome do serviço) |
| `DB_PORT` | `5432` | `5432` |
| `DB_USER` | `helptech` | `helptech` |
| `DB_PASSWORD` | `helptech` | `helptech` |
| `DB_NAME` | `helptech` | `helptech` |

## 7. Banco de dados

A tabela é criada automaticamente na inicialização (`CREATE TABLE IF NOT EXISTS`),
no método `criarTabela()` de [ChamadoRepositoryPostgres.js](src/repositories/ChamadoRepositoryPostgres.js).

```sql
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
```

Para inspecionar os dados gravados:

```bash
docker exec -it helptech-db psql -U helptech -d helptech -c "SELECT id, titulo, prioridade, status FROM chamados;"
```

## 8. Endpoints

Todos os exemplos abaixo usam a API rodando no Docker (`localhost:3001`). Se estiver
rodando com `npm start`, troque para `localhost:3000`.

### POST `/chamados` — abrir um chamado

```bash
curl -X POST http://localhost:3001/chamados \
  -H "Content-Type: application/json" \
  -d '{"titulo":"VPN cai","descricao":"A VPN desconecta a cada 5 minutos no setor de vendas.","solicitante":"Carlos Lima","setor":"Vendas","prioridade":"ALTA"}'
```

Resposta `201 Created`:

```json
{
  "id": "3336edb0-dc6f-483a-9666-ede0629efa04",
  "titulo": "VPN cai",
  "descricao": "A VPN desconecta a cada 5 minutos no setor de vendas.",
  "solicitante": "Carlos Lima",
  "setor": "Vendas",
  "prioridade": "ALTA",
  "status": "ABERTO",
  "criadoEm": "2026-10-27T18:00:00.000Z"
}
```

Resposta `400 Bad Request` (regra de negócio violada):

```json
{ "erro": "A descrição deve ter no mínimo 10 caracteres." }
```

### GET `/chamados` — listar chamados

```bash
curl http://localhost:3001/chamados
```

Aceita filtro opcional por prioridade (valores: `BAIXA`, `MEDIA`, `ALTA`):

```bash
curl "http://localhost:3001/chamados?prioridade=ALTA"
```

### GET `/chamados/:id` — consultar um chamado

```bash
curl http://localhost:3001/chamados/3336edb0-dc6f-483a-9666-ede0629efa04
```

Retorna `404 Not Found` quando o id não existe.

### GET `/health` — verificação rápida

```bash
curl http://localhost:3001/health
```

## 9. Regras de negócio

Implementadas na camada **Service** (`src/services/ChamadoService.js`):

- **RN1 — Descrição útil:** `descricao` é obrigatória e deve ter no mínimo **10 caracteres**
  (após remover espaços). Evita chamados vagos como "não funciona".
- **RN2 — Prioridade válida:** `prioridade` deve ser exatamente `BAIXA`, `MEDIA` ou `ALTA`.
  Evita valores inventados que quebram a triagem.

Quando uma regra é violada, o Service lança `RegraNegocioError` e o Controller converte
em **HTTP 400**.

## 10. Testes

```bash
npm test
```

Os testes são independentes (cada um cria uma aplicação nova com o repositório em
memória vazio) e não dependem da ordem de execução. **Não precisam de banco de dados.**

Cenários cobertos:

| Cenário | Verificação |
| --- | --- |
| Cadastro válido | `POST /chamados` retorna `201` com `id`, `status` `ABERTO` |
| Cadastro inválido (descrição curta) | `POST /chamados` retorna `400` (RN1) |
| Cadastro inválido (prioridade inválida) | `POST /chamados` retorna `400` (RN2) |
| Cadastro inválido (campo obrigatório ausente) | `POST /chamados` retorna `400` |
| Consulta | `GET /chamados` retorna `200` com a lista cadastrada |
| Consulta vazia | `GET /chamados` retorna `200` com `[]` |
| Consulta por id inexistente | `GET /chamados/:id` retorna `404` |

## 11. Princípio SOLID aplicado: DIP (Dependency Inversion)

- **Onde:** [IChamadoRepository.js](src/repositories/IChamadoRepository.js) (contrato),
  [ChamadoRepositoryMemory.js](src/repositories/ChamadoRepositoryMemory.js) e
  [ChamadoRepositoryPostgres.js](src/repositories/ChamadoRepositoryPostgres.js)
  (duas implementações), [ChamadoService.js](src/services/ChamadoService.js) (recebe o
  repositório pelo construtor) e [app.js](src/app.js) (injeção).
- **A prova real:** ao adicionar o PostgreSQL, **nenhuma linha** de `ChamadoService.js`
  ou `ChamadoController.js` precisou ser reescrita por causa do banco. Só mudaram os
  arquivos que escolhem *qual* implementação usar (`app.js` e `server.js`).
- **Como demonstrar na apresentação:** criar a aplicação com
  `criarApp(new ChamadoRepositoryMemory())` ou `criarApp(new ChamadoRepositoryPostgres(pool))`
  — a regra de negócio é exatamente a mesma.

> Também aplicamos o **SRP** (cada arquivo tem uma única razão para mudar) e a
> **Injeção de Dependência** (nada é instanciado dentro das classes de domínio).

## 12. Docker

O `docker-compose.yml` sobe o banco e a API juntos. Para subir só a imagem da API
isoladamente:

```bash
docker build -t helptech-api:1.0 .
docker run --rm -p 3001:3000 --name helptech \
  -e DB_HOST=host.docker.internal helptech-api:1.0
```

**Sobre a porta:** a API escuta na porta **3000 dentro do container**. No host mapeamos
para a **3001** (`"3001:3000"`) porque a porta 3000 desta máquina já está em uso por
outro projeto. Se na sua máquina a 3000 estiver livre, troque para `"3000:3000"`
no [docker-compose.yml](docker-compose.yml) e use `localhost:3000` nas chamadas.

O `Dockerfile` usa `node:22-alpine`, copia primeiro apenas os `package*.json` (para
aproveitar o cache de camadas), instala só dependências de produção com
`npm ci --omit=dev`, roda como usuário `node` sem privilégios e executa `node src/server.js`.

## 13. Autoria e Copyright

**© 2026 HelpTech API.** Todos os direitos reservados à equipe.

### Autoria e liderança técnica

**Vinicius Cavalcanti Lima**

### Colaboração

- **Vinicius Cavalcanti Lima** 
- **Berg Guedes** 
- **Julia Alves** 
- **Geisla Iasmin** 
- **Gabriel Oliveira** 
- **Filipe Inacio** 

Projeto desenvolvido para a disciplina de **Projeto Integrador** —
Bacharelado em Ciência da Computação, FACAPE.

#   P j - F a c u l d a d e  
 