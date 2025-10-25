FROM node:21-alpine3.19

WORKDIR /usr/src/app

COPY package.json ./
COPY pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install

# Solo copiar los archivos necesarios para desarrollo, no todo el código
COPY nest-cli.json ./
COPY tsconfig*.json ./

EXPOSE 3003
