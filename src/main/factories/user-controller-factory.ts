import { CreateUserUseCase } from '../../core/usecases/user/create-user';
import { GetUserUseCase } from '../../core/usecases/user/list-user';
import { UpdateUserUseCase } from '../../core/usecases/user/update-user';
import { UserController } from '../../infra/controllers/user-controller';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';

export function makeUserController() {
	const userRepository = new PrismaUserRepository();
	const createUserUseCase = new CreateUserUseCase(userRepository);
	const getUserUseCase = new GetUserUseCase(userRepository);
	const updateUserUseCase = new UpdateUserUseCase(userRepository);

	return new UserController(
		createUserUseCase,
		getUserUseCase,
		updateUserUseCase,
	);
}
