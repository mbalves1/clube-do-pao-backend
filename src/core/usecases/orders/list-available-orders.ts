import { Order } from '../../entities/orders';
import { OrdersRepository } from '../../ports/orders-repository';

export class ListAvailableOrdersUseCase {
	constructor(private ordersRepository: OrdersRepository) {}

	async execute(): Promise<Order[]> {
		const today = new Date();

		const startDate = new Date(today);
		startDate.setUTCHours(0, 0, 0, 0);

		const endDate = new Date(startDate);
		endDate.setUTCDate(endDate.getUTCDate() + 2);

		return this.ordersRepository.findAvailableForDelivery(startDate, endDate);
	}
}
