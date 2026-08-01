import { GetBakeryUseCase } from '../../core/usecases/bakery/list-bakery';
import { BakeryController } from '../../infra/controllers/bakery-controller';
import { PrismaBakeryRepository } from '../../infra/repositories/prisma-bakery-repository';

export function makeBakeryController() {
	const bakeryRepository = new PrismaBakeryRepository();
	const getBakeryUseCase = new GetBakeryUseCase(bakeryRepository);

	return new BakeryController(getBakeryUseCase);
}
