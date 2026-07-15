import { CreateUserUseCase } from '../../core/usecases/user/create-user';
import { GetUserUseCase } from '../../core/usecases/user/list-user';
import { UpdateUserUseCase } from '../../core/usecases/user/update-user';
import { UserController } from '../../infra/controllers/user-controller';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';
import { SupabaseAuthGateway } from '../../infra/gateways/supabase-auth-gateway';

export function makeUserController() {
	const userRepository = new PrismaUserRepository();
	const authGateway = new SupabaseAuthGateway();
	const createUserUseCase = new CreateUserUseCase(userRepository, authGateway);
	const getUserUseCase = new GetUserUseCase(userRepository);
	const updateUserUseCase = new UpdateUserUseCase(userRepository);

	return new UserController(
		createUserUseCase,
		getUserUseCase,
		updateUserUseCase,
	);
}
