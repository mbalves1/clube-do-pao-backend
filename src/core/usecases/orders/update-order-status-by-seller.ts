import { Order, OrderStatus } from '../../entities/orders';
import { ConflictError } from '../../errors/ConflictError';
import { ForbiddenError } from '../../errors/ForbiddenError';
import { NotFoundError } from '../../errors/NotFoundError';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { OrderStatusPatch, OrdersRepository } from '../../ports/orders-repository';
import { UserRepository } from '../../ports/user-repository';
import { sseService } from '../../../infra/sse/sse-service';
import { resolveOwnerBakeryId } from '../shared/resolve-owner-bakery-id';
import { assertOrderTransition } from './order-status-transitions';

export class UpdateOrderStatusBySellerUseCase {
	constructor(
		private ordersRepository: OrdersRepository,
		private userRepository: UserRepository,
		private bakeryPersonRepository: BakeryPersonRepository,
	) {}

	async execute(
		callerSupabaseUserId: string,
		orderId: number,
		targetStatus: OrderStatus,
	): Promise<Order> {
		const bakeryId = await resolveOwnerBakeryId(
			callerSupabaseUserId,
			this.userRepository,
			this.bakeryPersonRepository,
		);

		const order = await this.ordersRepository.findByIdWithItems(orderId);
		if (!order) {
			throw new NotFoundError('Pedido não encontrado');
		}
		if (order.bakeryId !== bakeryId) {
			throw new ForbiddenError('Você não tem permissão para esta ação');
		}

		if (
			targetStatus === 'CANCELED' &&
			order.fulfillmentType === 'DELIVERY' &&
			order.deliveryPersonId
		) {
			throw new ConflictError(
				'Pedido já foi reivindicado por um entregador',
			);
		}

		assertOrderTransition(
			order.status,
			targetStatus,
			'seller',
			order.fulfillmentType,
		);

		const now = new Date();
		const patch: OrderStatusPatch = {
			...(targetStatus === 'PREPARING' && { preparingAt: now }),
			...(targetStatus === 'READY' && { readyAt: now }),
			...(targetStatus === 'CANCELED' && { canceledAt: now }),
			...(targetStatus === 'PICKED_UP' && { pickedUpAt: now }),
		};

		const updated = await this.ordersRepository.updateStatus(
			orderId,
			targetStatus,
			patch,
		);

		sseService.emit('order-status-updated', { orderId, status: targetStatus });

		if (targetStatus === 'READY' && order.fulfillmentType === 'DELIVERY') {
			sseService.emit('order-available', {
				id: orderId,
				bakeryId: order.bakeryId,
				serviceDate: order.serviceDate,
			});
		}

		return updated;
	}
}
