import { SubscribeRepository } from '../../ports/subscribe-repository';

export class ListSubscribeUseCase {
	constructor(private subscribeRepository: SubscribeRepository) {}

	async execute(idUser: string): Promise<any> {
		return this.subscribeRepository.getList(idUser);
	}
}
