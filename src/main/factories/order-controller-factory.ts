import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';
import { OrdersController } from '../../infra/controllers/orders-controller';
import { PrismaSubscribeRepository } from '../../infra/repositories/prisma-subscribe-repository';

export function makeOrdersController() {
	const subscribeRepository = new PrismaSubscribeRepository();
	const listSubscribeUseCase = new ListOrdersUseCase(subscribeRepository);

	return new OrdersController(listSubscribeUseCase);
}
