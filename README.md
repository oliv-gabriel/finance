# Financeiro App

Aplicação de finanças pessoais construída com Next.js, React, Prisma e PostgreSQL.

## Desenvolvimento local

Requisitos:

- Node.js 22
- PostgreSQL acessível pela aplicação

Copie `.env.example` para `.env`, preencha as conexões e execute:

```bash
npm ci
npm run db:push
npm run dev
```

O projeto fica disponível em `http://localhost:3000`.

## Deploy na Vercel

1. Importe o repositório com o preset **Next.js**.
2. Cadastre as variáveis abaixo em **Settings > Environment Variables** para Production e Preview.
3. Mantenha o Build Command padrão (`npm run build`) e o Install Command padrão (`npm install`).
4. Faça o deploy. O `postinstall` gera o Prisma Client automaticamente.

Variáveis obrigatórias:

| Variável | Uso |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL usada pela aplicação. Prefira a URL com pool de conexões do provedor. |
| `DIRECT_URL` | URL direta, usada apenas por operações de schema/migração. |

Variáveis opcionais para sincronização de e-mail:

| Variável | Uso |
| --- | --- |
| `EMAIL_IMAP_HOST` | Servidor IMAP; o padrão é `imap.gmail.com`. |
| `EMAIL_USER` | Usuário da conta de e-mail. |
| `EMAIL_PASS` | Senha de app/credencial IMAP. |

Não execute `prisma db push` automaticamente a cada build. Prepare o banco antes do primeiro deploy e aplique mudanças de schema de forma controlada.

Para menor latência, configure a região das Functions próxima à região do PostgreSQL no painel da Vercel. O projeto fixa Node.js 22 pelo campo `engines` do `package.json`.

## Validação

```bash
npm run build
npx tsc --noEmit
npm run lint
```

O build e o TypeScript devem passar antes do deploy. O lint ainda registra débitos técnicos preexistentes; eles devem ser tratados gradualmente e não são ignorados pelo projeto.

## Segurança antes de produção

Este repositório ainda não possui autenticação/autorização. Não publique dados financeiros reais até proteger as páginas e todas as Server Actions, especialmente as ações de exclusão e sincronização de e-mail.
