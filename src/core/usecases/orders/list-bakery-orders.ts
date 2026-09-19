import { Order, OrderStatus } from '../../entities/orders';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { OrdersRepository } from '../../ports/orders-repository';
import { UserRepository } from '../../ports/user-repository';
import { resolveOwnerBakeryId } from '../shared/resolve-owner-bakery-id';

interface ListBakeryOrdersFilters {
	status?: OrderStatus;
	date?: string;
}

export class ListBakeryOrdersUseCase {
	constructor(
		private ordersRepository: OrdersRepository,
		private userRepository: UserRepository,
		private bakeryPersonRepository: BakeryPersonRepository,
	) {}

	private parseUtcDayRange(date: string): { from: Date; to: Date } {
		const [day, month, year] = date.split('-').map(Number);

		return {
			from: new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)),
			to: new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999)),
		};
	}

	async execute(
		callerSupabaseUserId: string,
		filters: ListBakeryOrdersFilters,
	): Promise<Order[]> {
		const bakeryId = await resolveOwnerBakeryId(
			callerSupabaseUserId,
			this.userRepository,
			this.bakeryPersonRepository,
		);

		let serviceDateFrom: Date | undefined;
		let serviceDateTo: Date | undefined;

		if (filters.date) {
			const range = this.parseUtcDayRange(filters.date);
			serviceDateFrom = range.from;
			serviceDateTo = range.to;
		}

		return this.ordersRepository.listByBakery(bakeryId, {
			status: filters.status,
			serviceDateFrom,
			serviceDateTo,
		});
	}
}
