import { LoginUseCase } from '../../core/usecases/auth/login';
import { RefreshSessionUseCase } from '../../core/usecases/auth/refresh-session';
import { AuthController } from '../../infra/controllers/auth-controller';
import { SupabaseAuthGateway } from '../../infra/gateways/supabase-auth-gateway';
import { PrismaBakeryRepository } from '../../infra/repositories/prisma-bakery-repository';
import { PrismaDeliveryUserRepository } from '../../infra/repositories/prisma-delivery-user-repository';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';

export function makeAuthController() {
	const authGateway = new SupabaseAuthGateway();
	const userRepository = new PrismaUserRepository();
	const bakeryRepository = new PrismaBakeryRepository();
	const deliveryUserRepository = new PrismaDeliveryUserRepository();

	const loginUseCase = new LoginUseCase(
		authGateway,
		userRepository,
		bakeryRepository,
		deliveryUserRepository,
	);
	const refreshSessionUseCase = new RefreshSessionUseCase(authGateway);

	return new AuthController(loginUseCase, refreshSessionUseCase);
}
