import { Router } from 'express';
import { BakeryController } from '../../controllers/bakery-controller';

export function makeBakeryRoutes(bakeryController: BakeryController) {
	const router = Router();

	router
		.route('/bakery')
		.get((req, res) => bakeryController.list(req, res))
		.post((req, res) => bakeryController.create(req, res));

	return router;
}
