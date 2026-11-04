# HelpTech API

![Node.js](https://img.shields.io/badge/Node.js-22-339933?logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.19-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?logo=postgresql&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-29-C21325?logo=jest&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)
![Testes](https://img.shields.io/badge/testes-7%2F7-brightgreen)

API REST para **abertura e consulta de chamados de suporte de TI**.

> **Projeto Integrador** — Bacharelado em Ciência da Computação — FACAPE

---

## Começando rápido

```bash
git clone <URL-DO-REPOSITORIO>
cd pj-sist-gustavo
docker compose up -d --build
curl http://localhost:3001/health
```

A API fica disponível em **http://localhost:3001**.

---

## Sumário

1. [Descrição do problema](#1-descrição-do-problema)
2. [Tecnologias](#2-tecnologias)
3. [Estrutura do projeto](#3-estrutura-do-projeto)
4. [Como rodar com Docker Compose](#4-como-rodar-com-docker-compose)
5. [Como rodar localmente](#5-como-rodar-localmente)
6. [Variáveis de ambiente](#6-variáveis-de-ambiente)
7. [Banco de dados](#7-banco-de-dados)
8. [Endpoints](#8-endpoints)
9. [Regras de negócio](#9-regras-de-negócio)
10. [Testes](#10-testes)
11. [Princípio SOLID aplicado](#11-princípio-solid-aplicado)
12. [Docker](#12-docker)
13. [Autoria e Copyright](#13-autoria-e-copyright)

---

## 1. Descrição do problema

O setor de TI de uma pequena empresa recebe pedidos de suporte por canais informais
(WhatsApp, e-mail, pedido verbal). Sem um registro padronizado, não se sabe quantos
chamados existem, qual a prioridade real de cada um nem quem solicitou. O resultado é
pedido esquecido, sem triagem e sem histórico.

Esta API resolve isso permitindo **abrir** e **consultar** chamados, garantindo que todo
chamado tenha **descrição útil** e **prioridade válida**, para que a fila de atendimento
faça sentido.

**Público-alvo:** equipe de TI e funcionários que abrem chamados de suporte.

## 2. Tecnologias

| Tecnologia | Versão | Papel no projeto |
| --- | --- | --- |
| [Node.js](https://nodejs.org) | 22 | ambiente de execução |
| [Express](https://expressjs.com) | 4.19 | servidor HTTP e definição das rotas |
| [PostgreSQL](https://www.postgresql.org) + [pg](https://node-postgres.com) | 16 / 8.23 | persistência dos chamados |
| [Jest](https://jestjs.io) + [Supertest](https://github.com/ladjs/supertest) | 29 / 7 | testes automatizados de integração |
| [Docker](https://www.docker.com) / Compose | — | execução isolada da API e do banco |
| Git / GitHub | — | versionamento |

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

O fluxo de uma requisição é sempre o mesmo:

```
HTTP  →  Controller  →  Service  →  Repository  →  PostgreSQL
         (rotas)        (regras)    (dados)
```

## 4. Como rodar com Docker Compose

**Pré-requisito:** Docker Desktop em execução.

```bash
docker compose up -d --build
```

Isso sobe **dois containers**: o PostgreSQL (`helptech-db`) e a API (`helptech-api`).
A API só inicia depois que o banco está realmente pronto (healthcheck + `depends_on`).

Acesse em **http://localhost:3001** (a porta 3000 do host já está ocupada por outro
container nesta máquina, então mapeamos a API na 3001 — veja a [seção 12](#12-docker)).

Comandos úteis:

| Comando | O que faz |
| --- | --- |
| `docker compose ps` | status dos containers |
| `docker compose logs -f api` | logs da API em tempo real |
| `docker compose stop` | para os containers, mantendo os dados |
| `docker compose down` | remove os containers, mantendo os dados |
| `docker compose down -v` | remove tudo, **apagando os dados do banco** |

## 5. Como rodar localmente

**Pré-requisito:** Node.js 18+ (testado com Node 24) e um PostgreSQL acessível.

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

### Resumo

| Método | Rota | Descrição | Sucesso | Erros |
| --- | --- | --- | --- | --- |
| `POST` | `/chamados` | abre um chamado | `201` | `400` |
| `GET` | `/chamados` | lista todos (filtro opcional `?prioridade=`) | `200` | `400` |
| `GET` | `/chamados/:id` | consulta por id | `200` | `404` |
| `GET` | `/health` | verificação de disponibilidade | `200` | — |

## 9. Regras de negócio

Implementadas na camada **Service** ([ChamadoService.js](src/services/ChamadoService.js)):

| Regra | Descrição | Motivo |
| --- | --- | --- |
| **RN1** | `descricao` é obrigatória e deve ter no mínimo **10 caracteres** (após remover espaços) | evita chamados vagos como "não funciona" |
| **RN2** | `prioridade` deve ser exatamente `BAIXA`, `MEDIA` ou `ALTA` | evita valores inventados que quebram a triagem |

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

## 11. Princípio SOLID aplicado

**DIP — Dependency Inversion Principle**

- **Onde:** [IChamadoRepository.js](src/repositories/IChamadoRepository.js) (contrato),
  [ChamadoRepositoryMemory.js](src/repositories/ChamadoRepositoryMemory.js) e
  [ChamadoRepositoryPostgres.js](src/repositories/ChamadoRepositoryPostgres.js)
  (duas implementações), [ChamadoService.js](src/services/ChamadoService.js) (recebe o
  repositório pelo construtor) e [app.js](src/app.js) (injeção).
- **Problema que evita:** sem DIP, o Service ficaria acoplado ao armazenamento em memória.
  Trocar por banco de dados — ou usar um repositório falso nos testes — obrigaria a
  editar as classes de domínio.
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
