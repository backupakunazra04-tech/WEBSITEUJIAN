import 'dotenv/config' // Wajib agar .env terbaca
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    // Di Prisma 7, koneksi database ditaruh di sini
    url: env('DIRECT_URL'),
  },
});