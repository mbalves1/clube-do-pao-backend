import { ConflictError } from '../../errors/ConflictError';
import { ForbiddenError } from '../../errors/ForbiddenError';
import { NotFoundError } from '../../errors/NotFoundError';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';

export type ReleasedOrder = {
	id: number;
	bakeryId: string;
	serviceDate: Date;
};

export class ReleaseOrderUseCase {
	constructor(
		private subscribeRepository: SubscribeRepository,
		private deliveryUserRepository: DeliveryUserRepository,
	) {}

	async execute(
		orderId: number,
		supabaseUserId: string,
	): Promise<ReleasedOrder> {
		const courier =
			await this.deliveryUserRepository.findBySupabaseUserId(supabaseUserId);
		if (!courier) {
			throw new NotFoundError('Entregador não encontrado');
		}

		const order = await this.subscribeRepository.getSubscribeById(orderId);
		if (!order) {
			throw new NotFoundError('Pedido não encontrado');
		}

		if (order.deliveryPersonId !== courier.id) {
			throw new ForbiddenError('Você não tem permissão para esta ação');
		}

		if (order.status !== 'ACCEPTED') {
			throw new ConflictError('Pedido não está mais aceito');
		}

		const released = await this.subscribeRepository.release(
			orderId,
			courier.id,
		);
		if (!released) {
			throw new ConflictError('Pedido não está mais aceito');
		}

		return {
			id: order.id,
			bakeryId: order.bakeryId,
			serviceDate: order.serviceDate,
		};
	}
}
