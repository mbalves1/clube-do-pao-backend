import { SubscribeRepository } from '../../ports/subscribe-repository';

export class ListAllSubscribeUseCase {
	constructor(private subscribeRepository: SubscribeRepository) {}

	async execute(): Promise<any> {
		return this.subscribeRepository.getAll();
	}
}
