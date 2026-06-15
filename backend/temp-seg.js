const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.segment.create({
  data: {
    name: 'All Customers',
    description: 'Everyone in the database',
    rules_json: JSON.stringify({ conditions: [], logicalOperator: "AND" }),
    created_by_ai: false
  }
}).then(console.log).catch(console.error).finally(() => prisma.$disconnect());
