import { ConflictError } from '../../errors/ConflictError';
import { NotFoundError } from '../../errors/NotFoundError';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { OrdersRepository } from '../../ports/orders-repository';
import { UserRepository } from '../../ports/user-repository';

export class AcceptOrderUseCase {
	constructor(
		private ordersRepository: OrdersRepository,
		private deliveryUserRepository: DeliveryUserRepository,
		private userRepository: UserRepository,
	) {}

	async execute(orderId: number, supabaseUserId: string): Promise<void> {
		const user =
			await this.userRepository.findBySupabaseUserId(supabaseUserId);
		if (!user) {
			throw new NotFoundError('Entregador não encontrado');
		}

		const courier = await this.deliveryUserRepository.findByUserId(user.id);
		if (!courier) {
			throw new NotFoundError('Entregador não encontrado');
		}

		const order = await this.ordersRepository.findByIdWithItems(orderId);
		if (!order) {
			throw new NotFoundError('Pedido não encontrado');
		}

		const claimed = await this.ordersRepository.claim(orderId, courier.id);
		if (!claimed) {
			throw new ConflictError('Pedido já foi reivindicado');
		}
	}
}
