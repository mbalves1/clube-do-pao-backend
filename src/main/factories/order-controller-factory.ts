import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';
import { UpdateOrdersUseCase } from '../../core/usecases/orders/update-orders';
import { OrdersController } from '../../infra/controllers/orders-controller';
import { PrismaSubscribeRepository } from '../../infra/repositories/prisma-subscribe-repository';
import { PrismaOrdersRepository } from '../../infra/repositories/prisma-orders-repository';

export function makeOrdersController() {
	const subscribeRepository = new PrismaSubscribeRepository();
	const orderRepository = new PrismaOrdersRepository();
	const listSubscribeUseCase = new ListOrdersUseCase(subscribeRepository);
	const updateOrdersUseCase = new UpdateOrdersUseCase(
		subscribeRepository,
		orderRepository,
	);

	return new OrdersController(listSubscribeUseCase, updateOrdersUseCase);
}
