import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';
import { UpdateOrdersUseCase } from '../../core/usecases/orders/update-orders';
import { ListAvailableOrdersUseCase } from '../../core/usecases/orders/list-available-orders';
import { AcceptOrderUseCase } from '../../core/usecases/orders/accept-order';
import { ReleaseOrderUseCase } from '../../core/usecases/orders/release-order';
import { OrdersController } from '../../infra/controllers/orders-controller';
import { PrismaSubscribeRepository } from '../../infra/repositories/prisma-subscribe-repository';
import { PrismaOrdersRepository } from '../../infra/repositories/prisma-orders-repository';
import { PrismaDeliveryUserRepository } from '../../infra/repositories/prisma-delivery-user-repository';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';

export function makeOrdersController() {
	const subscribeRepository = new PrismaSubscribeRepository();
	const orderRepository = new PrismaOrdersRepository();
	const deliveryUserRepository = new PrismaDeliveryUserRepository();
	const userRepository = new PrismaUserRepository();
	const listSubscribeUseCase = new ListOrdersUseCase(subscribeRepository);
	const updateOrdersUseCase = new UpdateOrdersUseCase(
		subscribeRepository,
		orderRepository,
		deliveryUserRepository,
		userRepository,
	);
	const listAvailableOrdersUseCase = new ListAvailableOrdersUseCase(
		subscribeRepository,
	);
	const acceptOrderUseCase = new AcceptOrderUseCase(
		subscribeRepository,
		deliveryUserRepository,
		userRepository,
	);
	const releaseOrderUseCase = new ReleaseOrderUseCase(
		subscribeRepository,
		deliveryUserRepository,
		userRepository,
	);

	return new OrdersController(
		listSubscribeUseCase,
		updateOrdersUseCase,
		listAvailableOrdersUseCase,
		acceptOrderUseCase,
		releaseOrderUseCase,
	);
}
