import { NotFoundError } from '../../errors/NotFoundError';
import { SubscribeRepository } from '../../ports/subscribe-repository';

export class ListSubscribeUseCase {
	constructor(private subscribeRepository: SubscribeRepository) {}

	async execute(idUser: string): Promise<any> {
		const subscriptions = await this.subscribeRepository.getList(idUser);

		if (!subscriptions?.length) {
			throw new NotFoundError(
				'Nenhuma assinatura encontrada para este usuário',
			);
		}

		return subscriptions;
	}
}
