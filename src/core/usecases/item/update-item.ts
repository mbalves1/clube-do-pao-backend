import { ForbiddenError } from '../../errors/ForbiddenError';
import { NotFoundError } from '../../errors/NotFoundError';
import { Item } from '../../entities/item';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { ItemRepository, UpdateItemData } from '../../ports/item-repository';
import { UserRepository } from '../../ports/user-repository';
import { resolveOwnerBakeryId } from '../shared/resolve-owner-bakery-id';

export class UpdateItemUseCase {
	constructor(
		private itemRepository: ItemRepository,
		private userRepository: UserRepository,
		private bakeryPersonRepository: BakeryPersonRepository,
	) {}

	async execute(
		callerSupabaseUserId: string,
		itemId: string,
		data: UpdateItemData,
	): Promise<Item> {
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
			throw new ForbiddenError('Você não tem permissão para editar este item');
		}

		return this.itemRepository.update(itemId, data);
	}
}
