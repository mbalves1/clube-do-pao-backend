import { AvailableOrder, SubscribeRepository } from '../../ports/subscribe-repository';

export class ListAvailableOrdersUseCase {
	constructor(private subscribeRepository: SubscribeRepository) {}

	async execute(): Promise<AvailableOrder[]> {
		const today = new Date();

		const startDate = new Date(today);
		startDate.setUTCHours(0, 0, 0, 0);

		const endDate = new Date(startDate);
		endDate.setUTCDate(endDate.getUTCDate() + 2);

		return this.subscribeRepository.findAvailable(startDate, endDate);
	}
}
