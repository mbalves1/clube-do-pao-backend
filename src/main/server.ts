import express from 'express';
import { CreateUserUseCase } from '../core/usecases/create-user';
import { PrismaUserRepository } from '../infra/repositories/prisma-user-repository';
import { UserController } from '../infra/controllers/user-controller';
import { makeRoutes } from '../infra/http/routes';
import { prisma } from '../infra/database/prisma-client';
import { GetUserUseCase } from '../core/usecases/list-user';

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json());

const userRepository = new PrismaUserRepository();
const createUserUseCase = new CreateUserUseCase(userRepository);
const getUserUseCase = new GetUserUseCase(userRepository);
const userController = new UserController(createUserUseCase, getUserUseCase);
app.use('/api', makeRoutes(userController));

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
