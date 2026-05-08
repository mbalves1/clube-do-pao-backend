import express from 'express';
import { makeRoutes } from '../infra/http/routes';
import { prisma } from '../infra/database/prisma-client';
import { makeUserController } from './factories/user-controller-factory';

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json());

app.use('/api', makeRoutes(makeUserController()));

app.use(
	(
		err: unknown,
		req: express.Request,
		res: express.Response,
		next: express.NextFunction,
	) => {
		console.error(err);
		return res.status(500).json({ message: 'Erro interno do servidor' });
	},
);

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
