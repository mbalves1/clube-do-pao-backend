import app from './app';
import { prisma } from '../infra/database/prisma-client';

const port = process.env.PORT || 3333;

async function start() {
	await prisma.$connect();
	app.listen(port, () => {
		console.log(`Servidor rodando em http://localhost:${port}`);
	});
}

start().catch((error) => {
	console.error('Falha ao iniciar o servidor:', error);
	process.exit(1);
});
