import { ForbiddenError } from '../../errors/ForbiddenError';
import { NotFoundError } from '../../errors/NotFoundError';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { ItemRepository } from '../../ports/item-repository';
import { UserRepository } from '../../ports/user-repository';
import { resolveOwnerBakeryId } from '../shared/resolve-owner-bakery-id';

export class DeleteItemUseCase {
	constructor(
		private itemRepository: ItemRepository,
		private userRepository: UserRepository,
		private bakeryPersonRepository: BakeryPersonRepository,
	) {}

	async execute(
		callerSupabaseUserId: string,
		itemId: string,
	): Promise<void> {
		const bakeryId = await resolveOwnerBakeryId(
			callerSupabaseUserId,
			this.userRepository,
			this.bakeryPersonRepository,
		);

		const item = await this.itemRepository.findById(itemId);
		if (!item) {
			throw new NotFoundError('Item não encontrado');
		}
		if (item.bakeryId !== bakeryId) {
			throw new ForbiddenError(
				'Você não tem permissão para excluir este item',
			);
		}

		await this.itemRepository.delete(itemId);
	}
}
