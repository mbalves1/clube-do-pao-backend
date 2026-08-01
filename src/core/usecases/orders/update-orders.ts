import { ForbiddenError } from '../../errors/ForbiddenError';
import { NotFoundError } from '../../errors/NotFoundError';
import { OrderStatus } from '../../entities/orders';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { OrdersRepository } from '../../ports/orders-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';
import { UserRepository } from '../../ports/user-repository';

export class UpdateOrdersUseCase {
	constructor(
		private subscribeRepository: SubscribeRepository,
		private ordersRepository: OrdersRepository,
		private deliveryUserRepository: DeliveryUserRepository,
		private userRepository: UserRepository,
	) {}

	async execute(
		orderId: number,
		deliveryId: string,
		status: OrderStatus,
		callerSupabaseUserId: string,
	): Promise<any> {
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

		const order = await this.subscribeRepository.getSubscribeById(orderId);

		const orderAllocate =
			await this.ordersRepository.findBySubscriptionId(orderId);

		if (orderAllocate) {
			await this.ordersRepository.update({
				id: orderAllocate.id,
				subscriptionId: orderId,
				deliveryPersonId: deliveryId,
				serviceDate: order.serviceDate,
				status,
			});
			return await this.subscribeRepository.updateOrder(
				orderId,
				deliveryId,
				status,
			);
		}

		await this.ordersRepository.create(
			{
				...order,
				status,
			},
			deliveryId,
		);
		return await this.subscribeRepository.updateOrder(
			orderId,
			deliveryId,
			status,
		);
	}
}
