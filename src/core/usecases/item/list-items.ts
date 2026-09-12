import { Item } from '../../entities/item';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { ItemRepository } from '../../ports/item-repository';
import { UserRepository } from '../../ports/user-repository';
import { resolveOwnerBakeryId } from '../shared/resolve-owner-bakery-id';

export class ListItemsUseCase {
	constructor(
		private itemRepository: ItemRepository,
		private userRepository: UserRepository,
		private bakeryPersonRepository: BakeryPersonRepository,
	) {}

	async execute(callerSupabaseUserId: string): Promise<Item[]> {
		const bakeryId = await resolveOwnerBakeryId(
			callerSupabaseUserId,
			this.userRepository,
			this.bakeryPersonRepository,
		);

		return this.itemRepository.findByBakeryId(bakeryId);
	}
}
