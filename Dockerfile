# Imagem base leve do Node.js
FROM node:22-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia apenas os manifests primeiro, para aproveitar o cache de camadas:
# se o código mudar, a instalação das dependências não é refeita.
COPY package*.json ./

# Instala somente as dependências de produção (sem Jest/Supertest)
RUN npm ci --omit=dev

# Copia o código da aplicação
COPY src ./src

# Porta em que a API escuta
EXPOSE 3000

# Executa como usuário sem privilégios (já existe na imagem oficial do Node)
USER node

# Comando de inicialização
CMD ["node", "src/server.js"]
