import { Bakery } from '../../entities/bakery';
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

		const bakery: Bakery = {
			name: data.name,
			cnpj: data.cnpj,
			email: data.email,
			phone: data.phone,
			whatsapp: data.whatsapp,
			serviceStartAt: data.serviceStartAt,
			serviceEndAt: data.serviceEndAt,
		};

		return this.bakeryRepository.create(bakery);
	}
}
