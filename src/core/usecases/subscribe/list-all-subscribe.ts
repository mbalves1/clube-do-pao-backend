import { SubscribeRepository } from '../../ports/subscribe-repository';

export class ListAllSubscribeUseCase {
	constructor(private subscribeRepository: SubscribeRepository) {}

	async execute(
		page: number,
		limit: number,
		serviceDate?: string,
	): Promise<any> {
		return this.subscribeRepository.getAll(page, limit, serviceDate);
	}
}
