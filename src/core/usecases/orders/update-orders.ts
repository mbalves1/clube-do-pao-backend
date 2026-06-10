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

		const orderAllocate =
			await this.ordersRepository.findBySubscriptionId(orderId);

		if (orderAllocate) {
			await this.ordersRepository.update({
				id: orderAllocate.id,
				subscriptionId: orderId,
				deliveryPersonId: deliveryId,
				serviceDate: order.serviceDate,
				status,
			});
			return await this.subscribeRepository.updateOrder(
				orderId,
				deliveryId,
				status,
			);
		}

		await this.ordersRepository.create(
			{
				...order,
				status,
			},
			deliveryId,
		);
		return await this.subscribeRepository.updateOrder(
			orderId,
			deliveryId,
			status,
		);
	}
}
