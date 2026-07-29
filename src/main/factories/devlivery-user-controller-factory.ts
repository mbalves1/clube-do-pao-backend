import { CreateDeliveryUserUseCase } from '../../core/usecases/delivery/create-delivery';
import { DeliveryUsersController } from '../../infra/controllers/delivery-users-controller';
import { PrismaDeliveryUserRepository } from '../../infra/repositories/prisma-delivery-user-repository';
import { SupabaseAuthGateway } from '../../infra/gateways/supabase-auth-gateway';

export function makeDeliveryUserController() {
	const deliveryUserRepository = new PrismaDeliveryUserRepository();
	const authGateway = new SupabaseAuthGateway();
	// const getBakeryUseCase = new GetBakeryUseCase(deliveryUserRepository);
	const createBakeryUseCase = new CreateDeliveryUserUseCase(
		deliveryUserRepository,
		authGateway,
	);

	return new DeliveryUsersController(createBakeryUseCase);
}
