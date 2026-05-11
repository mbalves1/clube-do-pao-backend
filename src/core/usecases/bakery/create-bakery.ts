import { Bakery } from '../../entities/bakery';
import { toBakery } from '../../mappers/bakery-mapper';
import { BakeryRepository } from '../../ports/bakery-repository';

export type CreateBakeryDTO = {
	name: string;
	cnpj: string;
	email: string;
	phone: string;
	whatsapp: string;
	serviceStartAt: string;
	serviceEndAt: string;
};

export class CreateBakeryUseCase {
	constructor(private bakeryRepository: BakeryRepository) {}

	async execute(data: CreateBakeryDTO): Promise<Bakery> {
		const existingBakery = await this.bakeryRepository.findByCnpj(data.cnpj);

		if (existingBakery) {
			throw new Error('CNPJ já está em uso');
		}

		const bakery = toBakery(data);

		return this.bakeryRepository.create(bakery);
	}
}
