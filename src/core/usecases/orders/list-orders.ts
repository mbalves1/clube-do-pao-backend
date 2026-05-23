import { SubscribeRepository } from '../../ports/subscribe-repository';

export class ListOrdersUseCase {
	constructor(private subscribeRepository: SubscribeRepository) {}

	async execute(): Promise<any> {
		const today = new Date();

		const startOfDay = new Date(today);
		startOfDay.setUTCHours(0, 0, 0, 0);

		const endOfDay = new Date(startOfDay);
		endOfDay.setUTCDate(endOfDay.getUTCDate() + 1);

		return this.subscribeRepository.getOrderByDay(startOfDay, endOfDay);
	}
}
