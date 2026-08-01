import { LoginUseCase } from '../../core/usecases/auth/login';
import { RefreshSessionUseCase } from '../../core/usecases/auth/refresh-session';
import { GetMeUseCase } from '../../core/usecases/auth/get-me';
import { AuthController } from '../../infra/controllers/auth-controller';
import { SupabaseAuthGateway } from '../../infra/gateways/supabase-auth-gateway';
import { PrismaBakeryPersonRepository } from '../../infra/repositories/prisma-bakery-person-repository';
import { PrismaDeliveryUserRepository } from '../../infra/repositories/prisma-delivery-user-repository';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';

export function makeAuthController() {
	const authGateway = new SupabaseAuthGateway();
	const userRepository = new PrismaUserRepository();
	const bakeryPersonRepository = new PrismaBakeryPersonRepository();
	const deliveryUserRepository = new PrismaDeliveryUserRepository();

	const loginUseCase = new LoginUseCase(
		authGateway,
		userRepository,
		bakeryPersonRepository,
		deliveryUserRepository,
	);
	const refreshSessionUseCase = new RefreshSessionUseCase(authGateway);
	const getMeUseCase = new GetMeUseCase(
		userRepository,
		bakeryPersonRepository,
		deliveryUserRepository,
	);

	return new AuthController(loginUseCase, refreshSessionUseCase, getMeUseCase);
}
