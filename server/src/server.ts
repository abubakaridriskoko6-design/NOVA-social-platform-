import env from './config/env.js';
import { app } from './app.js';
import { prisma } from './lib/prisma.js';

const port = env.PORT;
const host = env.HOST;

async function start() {
  if (env.NODE_ENV === 'production') {
    await prisma.$queryRaw`SELECT 1`;
  }

  const server = app.listen(port, host, () => {
    console.log(JSON.stringify({ event: 'server_started', host, port, environment: env.NODE_ENV }));
  });

  const shutdown = async (signal: string) => {
    console.log(JSON.stringify({ event: 'server_shutdown', signal }));
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.once('SIGTERM', () => void shutdown('SIGTERM'));
  process.once('SIGINT', () => void shutdown('SIGINT'));
}

void start().catch(() => {
  console.error(JSON.stringify({ event: 'server_start_failed', message: 'Production startup checks failed.' }));
  process.exitCode = 1;
});
