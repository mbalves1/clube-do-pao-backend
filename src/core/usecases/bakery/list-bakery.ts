import { Bakery } from '../../entities/bakery';
import { BakeryRepository } from '../../ports/bakery-repository';

export class GetBakeryUseCase {
	constructor(private bakeryRepository: BakeryRepository) {}

	async execute(): Promise<Bakery[]> {
		return this.bakeryRepository.find();
	}
}
