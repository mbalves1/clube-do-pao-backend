import { CreateItemUseCase } from '../../core/usecases/item/create-item';
import { DeleteItemUseCase } from '../../core/usecases/item/delete-item';
import { ListItemsUseCase } from '../../core/usecases/item/list-items';
import { UpdateItemUseCase } from '../../core/usecases/item/update-item';
import { ItemController } from '../../infra/controllers/item-controller';
import { PrismaBakeryPersonRepository } from '../../infra/repositories/prisma-bakery-person-repository';
import { PrismaItemRepository } from '../../infra/repositories/prisma-item-repository';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';

export function makeItemController() {
	const itemRepository = new PrismaItemRepository();
	const userRepository = new PrismaUserRepository();
	const bakeryPersonRepository = new PrismaBakeryPersonRepository();

	const createItemUseCase = new CreateItemUseCase(
		itemRepository,
		userRepository,
		bakeryPersonRepository,
	);
	const listItemsUseCase = new ListItemsUseCase(
		itemRepository,
		userRepository,
		bakeryPersonRepository,
	);
	const updateItemUseCase = new UpdateItemUseCase(
		itemRepository,
		userRepository,
		bakeryPersonRepository,
	);
	const deleteItemUseCase = new DeleteItemUseCase(
		itemRepository,
		userRepository,
		bakeryPersonRepository,
	);

	return new ItemController(
		createItemUseCase,
		listItemsUseCase,
		updateItemUseCase,
		deleteItemUseCase,
	);
}
