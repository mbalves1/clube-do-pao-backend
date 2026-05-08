import { CreateUserUseCase } from '../../core/usecases/create-user';
import { GetUserUseCase } from '../../core/usecases/list-user';
import { UserController } from '../../infra/controllers/user-controller';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';

export function makeUserController() {
	const userRepository = new PrismaUserRepository();
	const createUserUseCase = new CreateUserUseCase(userRepository);
	const getUserUseCase = new GetUserUseCase(userRepository);

	return new UserController(createUserUseCase, getUserUseCase);
}
