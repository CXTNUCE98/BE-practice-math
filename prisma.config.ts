import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';

dotenv.config();

// Fallback dummy URL for build time (Vercel)
const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://dummy:dummy@localhost:5432/dummy';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: databaseUrl,
  },
});
