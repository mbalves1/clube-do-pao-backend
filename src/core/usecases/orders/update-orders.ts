import { OrdersRepository } from '../../ports/orders-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';

export class UpdateOrdersUseCase {
	constructor(
		private subscribeRepository: SubscribeRepository,
		private ordersRepository: OrdersRepository,
	) {}

	async execute(orderId: number, deliveryId: string): Promise<any> {
		const order = this.ordersRepository.findById(orderId);
		const sub = this.subscribeRepository;
		console.log('auqi', order);
		// if (!order) {
		// 	this.ordersRepository.create();
		// }

		return this.subscribeRepository.updateOrder(orderId, deliveryId);
	}
}
