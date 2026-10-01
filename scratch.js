const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.account.findMany({ where: { type: 'CARTAO' } }).then(c => {
  console.log(c);
  p.$disconnect();
});
