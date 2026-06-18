import { Router } from 'express';
import { BakeryController } from '../../controllers/bakery-controller';
import { authMiddleware } from '../../../middlewares/auth';

export function makeBakeryRoutes(bakeryController: BakeryController) {
	const router = Router();

	router.get('/bakery', (req, res) => bakeryController.list(req, res));
	router.post('/bakery', authMiddleware, (req, res) =>
		bakeryController.create(req, res),
	);

	return router;
}
