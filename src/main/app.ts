import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { makeRoutes } from '../infra/http/routes';
import { swaggerSpec } from '../infra/http/swagger';
import { makeBakeryController } from './factories/bakery-controller-factory';
import { makeOrdersController } from './factories/order-controller-factory';
import { makeSubscribeController } from './factories/subscribe-controller-factory';
import { makeUserController } from './factories/user-controller-factory';
import { makeDeliveryUserController } from './factories/devlivery-user-controller-factory';

const app = express();

app.use(express.json());
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.get('/health', (req, res) => {
	return res.status(200).json({ status: 'ok' });
});

app.use(
	'/api',
	makeRoutes({
		userController: makeUserController(),
		bakeryController: makeBakeryController(),
		ordersController: makeOrdersController(),
		subscribeController: makeSubscribeController(),
		deliveryUserController: makeDeliveryUserController(),
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

export default app;
