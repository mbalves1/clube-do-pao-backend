import { GetBakeryUseCase } from '../../core/usecases/bakery/list-bakery';
import { CreateBakeryUseCase } from '../../core/usecases/bakery/create-bakery';
import { BakeryController } from '../../infra/controllers/bakery-controller';
import { PrismaBakeryRepository } from '../../infra/repositories/prisma-bakery-repository';
import { PrismaUserRepository } from '../../infra/repositories/prisma-user-repository';
import { PrismaBakeryPersonRepository } from '../../infra/repositories/prisma-bakery-person-repository';

export function makeBakeryController() {
	const bakeryRepository = new PrismaBakeryRepository();
	const userRepository = new PrismaUserRepository();
	const bakeryPersonRepository = new PrismaBakeryPersonRepository();

	const getBakeryUseCase = new GetBakeryUseCase(bakeryRepository);
	const createBakeryUseCase = new CreateBakeryUseCase(
		bakeryRepository,
		userRepository,
		bakeryPersonRepository,
	);

	return new BakeryController(getBakeryUseCase, createBakeryUseCase);
}
