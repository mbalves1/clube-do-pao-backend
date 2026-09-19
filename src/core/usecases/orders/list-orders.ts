import { Order } from '../../entities/orders';
import { OrdersRepository } from '../../ports/orders-repository';

export class ListOrdersUseCase {
	constructor(private ordersRepository: OrdersRepository) {}

	async execute(): Promise<Order[]> {
		const today = new Date();

		const startOfDay = new Date(today);
		startOfDay.setUTCHours(0, 0, 0, 0);

		const endOfDay = new Date(startOfDay);
		endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

		return this.ordersRepository.findByDateRange(startOfDay, endOfDay);
	}
}
