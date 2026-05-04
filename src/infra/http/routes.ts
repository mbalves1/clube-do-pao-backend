import { Router } from 'express';
import { UserController } from '../controllers/user-controller';

export function makeRoutes(userController: UserController) {
	const router = Router();

	router.get('/users', (req, res) => userController.list(req, res));
	router.post('/users', (req, res) => userController.create(req, res));

	return router;
}
