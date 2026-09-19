import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';
import { UpdateOrdersUseCase } from '../../core/usecases/orders/update-orders';
import { ListAvailableOrdersUseCase } from '../../core/usecases/orders/list-available-orders';
import { AcceptOrderUseCase } from '../../core/usecases/orders/accept-order';
import { ReleaseOrderUseCase } from '../../core/usecases/orders/release-order';
import { GenerateOrdersFromSubscriptionsUseCase } from '../../core/usecases/orders/generate-orders-from-subscriptions';
import { ListBakeryOrdersUseCase } from '../../core/usecases/orders/list-bakery-orders';
import { UpdateOrderStatusBySellerUseCase } from '../../core/usecases/orders/update-order-status-by-seller';
import { OrdersController } from '../../infra/controllers/orders-controller';
import { PrismaSubscribeRepository } from '../../infra/repositories/prisma-subscribe-repository';
import { PrismaOrdersRepository } from '../../infra/repositories/prisma-orders-repository';
import { PrismaDeliveryUserRepository } from '../../infra/repositories/prisma-delivery-user-repository';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';
import { PrismaBakeryPersonRepository } from '../../infra/repositories/prisma-bakery-person-repository';

export function makeOrdersController() {
	const subscribeRepository = new PrismaSubscribeRepository();
	const orderRepository = new PrismaOrdersRepository();
	const deliveryUserRepository = new PrismaDeliveryUserRepository();
	const userRepository = new PrismaUserRepository();
	const bakeryPersonRepository = new PrismaBakeryPersonRepository();

	const listOrdersUseCase = new ListOrdersUseCase(orderRepository);
	const updateOrdersUseCase = new UpdateOrdersUseCase(
		orderRepository,
		deliveryUserRepository,
		userRepository,
	);
	const listAvailableOrdersUseCase = new ListAvailableOrdersUseCase(
		orderRepository,
	);
	const acceptOrderUseCase = new AcceptOrderUseCase(
		orderRepository,
		deliveryUserRepository,
		userRepository,
	);
	const releaseOrderUseCase = new ReleaseOrderUseCase(
		orderRepository,
		deliveryUserRepository,
		userRepository,
	);
	const generateOrdersFromSubscriptionsUseCase =
		new GenerateOrdersFromSubscriptionsUseCase(
			subscribeRepository,
			orderRepository,
		);
	const listBakeryOrdersUseCase = new ListBakeryOrdersUseCase(
		orderRepository,
		userRepository,
		bakeryPersonRepository,
	);
	const updateOrderStatusBySellerUseCase = new UpdateOrderStatusBySellerUseCase(
		orderRepository,
		userRepository,
		bakeryPersonRepository,
	);

	return new OrdersController(
		listOrdersUseCase,
		updateOrdersUseCase,
		listAvailableOrdersUseCase,
		acceptOrderUseCase,
		releaseOrderUseCase,
		generateOrdersFromSubscriptionsUseCase,
		listBakeryOrdersUseCase,
		updateOrderStatusBySellerUseCase,
	);
}
