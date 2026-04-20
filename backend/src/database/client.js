const { PrismaClient } = require('@prisma/client');

// Polyfill para serialização de BigInt (necessário para JSON.stringify no Express)
BigInt.prototype.toJSON = function() {
  return this.toString();
};

const prisma = new PrismaClient();

module.exports = prisma;
