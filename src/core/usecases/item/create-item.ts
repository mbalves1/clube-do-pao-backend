import { Item } from '../../entities/item';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { ItemRepository } from '../../ports/item-repository';
import { UserRepository } from '../../ports/user-repository';
import { resolveOwnerBakeryId } from '../shared/resolve-owner-bakery-id';

export type CreateItemInput = {
	name: string;
	description?: string | null;
	priceCents: number;
	available?: boolean;
};

export class CreateItemUseCase {
	constructor(
		private itemRepository: ItemRepository,
		private userRepository: UserRepository,
		private bakeryPersonRepository: BakeryPersonRepository,
	) {}

	async execute(
		callerSupabaseUserId: string,
		data: CreateItemInput,
	): Promise<Item> {
		const bakeryId = await resolveOwnerBakeryId(
			callerSupabaseUserId,
			this.userRepository,
			this.bakeryPersonRepository,
		);

		return this.itemRepository.create({ bakeryId, ...data });
	}
}
