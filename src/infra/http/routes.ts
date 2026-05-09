import { Router } from 'express';
import { BakeryController } from '../controllers/bakery-controller';
import { UserController } from '../controllers/user-controller';
import { makeBakeryRoutes } from './routes/bakery-routes';
import { makeUserRoutes } from './routes/user-routes';

type MakeRoutesParams = {
	userController: UserController;
	bakeryController: BakeryController;
};

export function makeRoutes({
	userController,
	bakeryController,
}: MakeRoutesParams) {
	const router = Router();

	router.use(makeUserRoutes(userController));
	router.use(makeBakeryRoutes(bakeryController));

	return router;
}
