# Dependências para migração

Este projeto é uma aplicação **Next.js + TypeScript + Prisma + PostgreSQL**. O arquivo `package-lock.json` é a fonte de verdade das versões transitivas; leve-o junto com `package.json` e use `npm ci` para uma instalação idêntica.

## Pré-requisitos

- Node.js 24.18.0 (ou versão LTS compatível)
- npm 11.16.0
- PostgreSQL acessível pela nova infraestrutura

## Instalação no novo ambiente

```bash
git clone <repositorio>
cd Financeiro
cp .env.example .env
# Preencha as variáveis em .env
npm ci
npx prisma generate
npx prisma db push
npx prisma db seed
npm run build
npm start
```

> Não use `npm install` para uma migração reproduzível: ele pode atualizar versões permitidas pelo `package.json`.

## Dependências diretas instaladas

| Pacote | Versão instalada |
| --- | --- |
| next | 16.2.5 |
| react / react-dom | 19.2.4 |
| typescript | 5.9.3 |
| prisma / @prisma/client | 6.2.1 |
| @prisma/adapter-pg | 7.8.0 |
| @prisma/adapter-better-sqlite3 / better-sqlite3 | 7.8.0 / 12.10.0 |
| pg | 8.20.0 |
| tailwindcss / @tailwindcss/postcss | 4.2.4 |
| recharts | 3.8.1 |
| react-grid-layout | 2.2.3 |
| lucide-react | 1.14.0 |
| date-fns | 4.1.0 |
| clsx / tailwind-merge | 2.1.1 / 3.5.0 |
| imapflow / mailparser | 1.3.5 / 3.9.9 |
| csv-stringify | 6.7.0 |
| tsx | 4.21.0 |
| eslint / eslint-config-next | 9.39.4 / 16.2.5 |

Os pacotes de tipos (`@types/*`) e as dependências indiretas também ficam fixados automaticamente no `package-lock.json`.

## Arquivos que devem acompanhar a migração

- `package.json` e `package-lock.json`
- `prisma/schema.prisma` e `prisma/seed.ts`
- `.env.example` (nunca o arquivo `.env` com segredos)
- código-fonte, configurações do Next.js e arquivos em `public/`

O banco não é exportado automaticamente: faça um backup/restauração separado do PostgreSQL antes de apontar `DATABASE_URL` e `DIRECT_URL` para o novo ambiente.
