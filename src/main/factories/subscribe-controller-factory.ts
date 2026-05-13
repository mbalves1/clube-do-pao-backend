import { CreateSubscribeUseCase } from '../../core/usecases/subscribe/create-subscribe';
import { SubscribeController } from '../../infra/controllers/subscribe-controller';
import { PrismaBakeryRepository } from '../../infra/repositories/prisma-bakery-repository';
import { PrismaSubscribeRepository } from '../../infra/repositories/prisma-subscribe-repository';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';

export function makeSubscribeController() {
	const subscribeRepository = new PrismaSubscribeRepository();
	const userRepository = new PrismaUserRepository();
	const bakeryRepository = new PrismaBakeryRepository();
	const createSubscribeUseCase = new CreateSubscribeUseCase(
		userRepository,
		bakeryRepository,
		subscribeRepository,
	);

	return new SubscribeController(createSubscribeUseCase);
}
