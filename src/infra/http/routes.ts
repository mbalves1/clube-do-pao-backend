import { Router } from 'express';
import { UserController } from '../controllers/user-controller';
import { makeUserRoutes } from './routes/user-routes';

export function makeRoutes(userController: UserController) {
	const router = Router();

	router.use(makeUserRoutes(userController));

	return router;
}
