import { ConflictError } from '../../errors/ConflictError';
import { OrderStatus } from '../../entities/orders';
import { OrdersRepository } from '../../ports/orders-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';

export class UpdateOrdersUseCase {
	constructor(
		private subscribeRepository: SubscribeRepository,
		private ordersRepository: OrdersRepository,
	) {}

	async execute(
		orderId: number,
		deliveryId: string,
		status: OrderStatus,
	): Promise<any> {
		const order = await this.subscribeRepository.getSubscribeById(orderId);
		const orderAllocate = await this.ordersRepository.findById(orderId);

		if (orderAllocate) {
			throw new ConflictError('Ordem ja alocada');
		}

		await this.ordersRepository.create({ ...order, status }, deliveryId);
		return await this.subscribeRepository.updateOrder(
			orderId,
			deliveryId,
			status,
		);
	}
}
