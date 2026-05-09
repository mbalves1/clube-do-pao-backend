# Clube do Pao

Backend em Node.js e TypeScript para o projeto **Clube do Pao**, uma aplicacao pensada para permitir que usuarios deixem compras agendadas para recebimento diario.

O projeto esta sendo construido com foco em **Clean Code** e **Clean Architecture**, separando regras de negocio, contratos, implementacoes externas e pontos de entrada HTTP.

## Objetivo

O Clube do Pao tem como finalidade organizar compras recorrentes, como pedidos diarios de paes e outros produtos, permitindo que o usuario cadastre suas preferencias e mantenha entregas agendadas.

## Tecnologias

- Node.js
- TypeScript
- Express
- Prisma ORM
- PostgreSQL
- Supabase client

## Arquitetura

A organizacao do codigo segue uma divisao inspirada em Clean Architecture:

```txt
src
├── core
│   ├── entities
│   ├── ports
│   └── usecases
├── infra
│   ├── controllers
│   ├── database
│   ├── http
│   └── repositories
└── main
```

### Camadas

**core**

Contem as regras centrais da aplicacao. Aqui ficam entidades, portas/interfaces e casos de uso. Essa camada nao deve depender de frameworks, banco de dados ou HTTP.

**infra**

Contem implementacoes externas, como controllers HTTP, repositorios com Prisma, cliente de banco de dados e rotas Express.

**main**

Responsavel por iniciar a aplicacao, configurar dependencias e subir o servidor.

## Requisitos

- Node.js
- npm
- Banco PostgreSQL disponivel

## Instalacao

```bash
npm install
```

Gere o Prisma Client:

```bash
npm run prisma:generate
```

## Executando em desenvolvimento

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Executando em producao

```bash
npm start
```

### Prisma

Gerar Prisma Client:

```bash
npm run prisma:generate
```

Formatar schema Prisma:

```bash
npm run prisma:format
```

Executar migrations:

```bash
npm run prisma:migrate
```

Sincronizar schema sem migration:

```bash
npm run prisma:push
```

Abrir Prisma Studio:

```bash
npm run prisma:studio
```

### Docker

Subir containers:

```bash
npm run docker:up
```

Parar containers:

```bash
npm run docker:down
```

### Setup inicial

Executa o ambiente completo pela primeira vez:

```bash
npm run setup
```

Esse comando:

- sobe os containers
- inicia o PostgreSQL
- executa as migrations do Prisma

## Estrutura do banco

O projeto utiliza Prisma ORM com PostgreSQL para gerenciamento de:

- usuarios
- padarias
- favoritos
- agendamentos

## Executando o projeto

### Primeira execucao

```bash
npm install
npm run setup
```

### Execucoes seguintes

```bash
npm run docker:up
```
