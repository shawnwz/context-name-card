import { PrismaClient } from '@prisma/client';
import { webcrypto } from 'node:crypto';

const prisma = new PrismaClient();

function randomString(size) {
  const buf = new Uint8Array(size);
  webcrypto.getRandomValues(buf);
  return Array.from(buf).map(b => b.toString(36)).join('').slice(0, size);
}

async function createHash(message) {
  const data = new TextEncoder().encode(message);
  const hash = await webcrypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const email = 'wzhe@outlook.com';
const rawToken = randomString(32);
const secret = process.env.AUTH_SECRET;
const hashedToken = await createHash(`${rawToken}${secret}`);
const expires = new Date(Date.now() + 60 * 60 * 1000);

await prisma.verificationToken.create({
  data: { identifier: email, token: hashedToken, expires },
});

console.log('RAW_TOKEN_START');
console.log(rawToken);
console.log('RAW_TOKEN_END');

await prisma.$disconnect();
