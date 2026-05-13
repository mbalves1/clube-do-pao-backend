import { Router } from 'express';
import { BakeryController } from '../controllers/bakery-controller';
import { UserController } from '../controllers/user-controller';
import { makeBakeryRoutes } from './routes/bakery-routes';
import { makeUserRoutes } from './routes/user-routes';
import { makeSubscribeRoutes } from './routes/subscribe-routes';
import { SubscribeController } from '../controllers/subscribe-controller';

type MakeRoutesParams = {
	userController: UserController;
	bakeryController: BakeryController;
	subscribeController: SubscribeController;
};

export function makeRoutes({
	userController,
	bakeryController,
	subscribeController,
}: MakeRoutesParams) {
	const router = Router();

	router.use(makeUserRoutes(userController));
	router.use(makeBakeryRoutes(bakeryController));
	router.use(makeSubscribeRoutes(subscribeController));

	return router;
}
