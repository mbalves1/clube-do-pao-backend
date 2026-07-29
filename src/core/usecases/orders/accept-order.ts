import { ConflictError } from '../../errors/ConflictError';
import { NotFoundError } from '../../errors/NotFoundError';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';

export class AcceptOrderUseCase {
	constructor(
		private subscribeRepository: SubscribeRepository,
		private deliveryUserRepository: DeliveryUserRepository,
	) {}

	async execute(orderId: number, supabaseUserId: string): Promise<void> {
		const courier =
			await this.deliveryUserRepository.findBySupabaseUserId(supabaseUserId);
		if (!courier) {
			throw new NotFoundError('Entregador não encontrado');
		}

		const order = await this.subscribeRepository.getSubscribeById(orderId);
		if (!order) {
			throw new NotFoundError('Pedido não encontrado');
		}

		const claimed = await this.subscribeRepository.claim(orderId, courier.id);
		if (!claimed) {
			throw new ConflictError('Pedido já foi reivindicado');
		}
	}
}
