import { BakeryRepository } from '../../ports/bakery-repository';

export class GetBakeryUseCase {
	constructor(private bakeryRepository: BakeryRepository) {}

	async execute(): Promise<any> {
		const bakeries = await this.bakeryRepository.find();
		console.log('bakeries', bakeries);
		return bakeries;
	}
}
