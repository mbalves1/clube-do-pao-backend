import { Router } from 'express';
import { DeliveryUsersController } from '../../controllers/delivery-users-controller';
import { createDeliverySchema } from '../validators/delivery-user-validator';
import { validateSchema } from '../../../middlewares/validate-schema';
import { authMiddleware } from '../../../middlewares/auth';

export function makeDeliveryUsersRoutes(
	deliveryUsersController: DeliveryUsersController,
) {
	const router = Router();

	router.post(
		'/delivery/register',
		authMiddleware,
		validateSchema(createDeliverySchema),
		(req, res) => deliveryUsersController.create(req, res),
	);

	return router;
}
