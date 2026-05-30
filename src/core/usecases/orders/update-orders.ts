import { ConflictError } from '../../errors/ConflictError';
import { OrdersRepository } from '../../ports/orders-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';

export class UpdateOrdersUseCase {
	constructor(
		private subscribeRepository: SubscribeRepository,
		private ordersRepository: OrdersRepository,
	) {}

	async execute(orderId: number, deliveryId: string): Promise<any> {
		const order = await this.subscribeRepository.getSubscribeById(orderId);
		const orderAllocate = await this.ordersRepository.findById(orderId);

		if (orderAllocate) {
			throw new ConflictError('Ordem ja alocada');
		}

		const sub = this.ordersRepository.create(order, deliveryId);
		return await this.subscribeRepository.updateOrder(orderId, deliveryId);
	}
}
