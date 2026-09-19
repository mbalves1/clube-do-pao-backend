import { ForbiddenError } from '../../errors/ForbiddenError';
import { NotFoundError } from '../../errors/NotFoundError';
import { Order, OrderStatus } from '../../entities/orders';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { OrderStatusPatch, OrdersRepository } from '../../ports/orders-repository';
import { UserRepository } from '../../ports/user-repository';
import { assertOrderTransition } from './order-status-transitions';

export class UpdateOrdersUseCase {
	constructor(
		private ordersRepository: OrdersRepository,
		private deliveryUserRepository: DeliveryUserRepository,
		private userRepository: UserRepository,
	) {}

	async execute(
		orderId: number,
		deliveryId: string,
		status: OrderStatus,
		callerSupabaseUserId: string,
	): Promise<Order> {
		const user = await this.userRepository.findBySupabaseUserId(
			callerSupabaseUserId,
		);
		if (!user) {
			throw new NotFoundError('Entregador não encontrado');
		}

		const courier = await this.deliveryUserRepository.findByUserId(user.id);
		if (!courier) {
			throw new NotFoundError('Entregador não encontrado');
		}

		if (courier.id !== deliveryId) {
			throw new ForbiddenError('Você não tem permissão para esta ação');
		}

		const order = await this.ordersRepository.findByIdWithItems(orderId);
		if (!order) {
			throw new NotFoundError('Pedido não encontrado');
		}

		if (order.deliveryPersonId !== courier.id) {
			throw new ForbiddenError('Você não tem permissão para esta ação');
		}

		assertOrderTransition(order.status, status, 'courier', order.fulfillmentType);

		const now = new Date();
		const patch: OrderStatusPatch = {
			...(status === 'PICKED_UP' && { pickedUpAt: now }),
			...(status === 'DELIVERED' && { deliveredAt: now }),
		};

		return this.ordersRepository.updateStatus(orderId, status, patch);
	}
}
