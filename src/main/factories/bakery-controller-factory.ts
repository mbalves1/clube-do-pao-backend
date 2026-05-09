import { CreateBakeryUseCase } from '../../core/usecases/bakery/create-bakery';
import { GetBakeryUseCase } from '../../core/usecases/bakery/list-bakery';
import { BakeryController } from '../../infra/controllers/bakery-controller';
import { PrismaBakeryRepository } from '../../infra/repositories/prisma-bakery-repository';

export function makeBakeryController() {
	const bakeryRepository = new PrismaBakeryRepository();
	const getBakeryUseCase = new GetBakeryUseCase(bakeryRepository);
	const createBakeryUseCase = new CreateBakeryUseCase(bakeryRepository);

	return new BakeryController(getBakeryUseCase, createBakeryUseCase);
}
