import { Router } from 'express';
import { OrdersController } from '../../controllers/orders-controller';

export function makeOrdersRoutes(ordersController: OrdersController) {
	const router = Router();

	router.route('/orders').get((req, res) => ordersController.list(req, res));

	return router;
}
