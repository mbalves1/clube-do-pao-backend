import express from 'express';
import { makeRoutes } from '../infra/http/routes';
import { prisma } from '../infra/database/prisma-client';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from '../infra/http/swagger';
import { makeUserController } from './factories/user-controller-factory';
import { makeBakeryController } from './factories/bakery-controller-factory';
import { makeSubscribeController } from './factories/subscribe-controller-factory';
import { makeOrdersController } from './factories/order-controller-factory';

const app = express();
const port = process.env.PORT || 3333;

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use(
	'/api',
	makeRoutes({
		userController: makeUserController(),
		bakeryController: makeBakeryController(),
		ordersController: makeOrdersController(),
		subscribeController: makeSubscribeController(),
	}),
);

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
