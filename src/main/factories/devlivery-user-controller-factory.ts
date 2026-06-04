import { CreateDeliveryUserUseCase } from '../../core/usecases/delivery/create-delivery';
import { DeliveryUsersController } from '../../infra/controllers/delivery-users-controller';
import { PrismaDeliveryUserRepository } from '../../infra/repositories/prisma-delivery-user-repository';

export function makeDeliveryUserController() {
	const deliveryUserRepository = new PrismaDeliveryUserRepository();
	// const getBakeryUseCase = new GetBakeryUseCase(deliveryUserRepository);
	const createBakeryUseCase = new CreateDeliveryUserUseCase(
		deliveryUserRepository,
	);

	return new DeliveryUsersController(createBakeryUseCase);
}
