import { SubscribeRepository } from '../../ports/subscribe-repository';

export class UpdateOrdersUseCase {
	constructor(private subscribeRepository: SubscribeRepository) {}

	async execute(orderId: number, deliveryId: string): Promise<any> {
		return this.subscribeRepository.updateOrder(orderId, deliveryId);
	}
}
