import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';
import { UpdateOrdersUseCase } from '../../core/usecases/orders/update-orders';
import { OrdersController } from '../../infra/controllers/orders-controller';
import { PrismaSubscribeRepository } from '../../infra/repositories/prisma-subscribe-repository';

export function makeOrdersController() {
	const subscribeRepository = new PrismaSubscribeRepository();
	const listSubscribeUseCase = new ListOrdersUseCase(subscribeRepository);
	const updateOrdersUseCase = new UpdateOrdersUseCase(subscribeRepository);

	return new OrdersController(listSubscribeUseCase, updateOrdersUseCase);
}
