import { OrdersRepository } from '../../ports/orders-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';

export class UpdateOrdersUseCase {
	constructor(
		private subscribeRepository: SubscribeRepository,
		private ordersRepository: OrdersRepository,
	) {}

	async execute(orderId: number, deliveryId: string): Promise<any> {
		const order = await this.subscribeRepository.getSubscribeById(orderId);
		const sub = this.ordersRepository.create(order, deliveryId);
		console.log('auqi', sub);
		// if (!order) {
		// 	this.ordersRepository.create();
		// }

		// return this.subscribeRepository.updateOrder(orderId, deliveryId);
	}
}
