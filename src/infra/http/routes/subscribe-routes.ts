import { Router } from 'express';
import { SubscribeController } from '../../controllers/subscribe-controller';

export function makeSubscribeRoutes(subscribeController: SubscribeController) {
	const router = Router();

	router
		.route('/subscribe/:id')
		.get((req, res) => subscribeController.list(req, res))
		.post((req, res) => subscribeController.create(req, res));

	return router;
}
