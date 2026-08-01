import { CreateUserUseCase } from '../../core/usecases/user/create-user';
import { GetUserUseCase } from '../../core/usecases/user/list-user';
import { UpdateUserUseCase } from '../../core/usecases/user/update-user';
import { UserController } from '../../infra/controllers/user-controller';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';
import { PrismaBakeryRepository } from '../../infra/repositories/prisma-bakery-repository';
import { PrismaBakeryPersonRepository } from '../../infra/repositories/prisma-bakery-person-repository';
import { PrismaDeliveryUserRepository } from '../../infra/repositories/prisma-delivery-user-repository';
import { SupabaseAuthGateway } from '../../infra/gateways/supabase-auth-gateway';

export function makeUserController() {
	const userRepository = new PrismaUserRepository();
	const bakeryRepository = new PrismaBakeryRepository();
	const bakeryPersonRepository = new PrismaBakeryPersonRepository();
	const deliveryUserRepository = new PrismaDeliveryUserRepository();
	const authGateway = new SupabaseAuthGateway();
	const createUserUseCase = new CreateUserUseCase(
		userRepository,
		authGateway,
		bakeryRepository,
		bakeryPersonRepository,
		deliveryUserRepository,
	);
	const getUserUseCase = new GetUserUseCase(userRepository);
	const updateUserUseCase = new UpdateUserUseCase(userRepository);

	return new UserController(
		createUserUseCase,
		getUserUseCase,
		updateUserUseCase,
	);
}
