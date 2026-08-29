import { Bakery } from '../../entities/bakery';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { BakeryRepository } from '../../ports/bakery-repository';
import { UserRepository } from '../../ports/user-repository';
import { ConflictError } from '../../errors/ConflictError';
import { NotFoundError } from '../../errors/NotFoundError';

export type CreateBakeryInput = {
	name: string;
	cnpj: string;
	email: string;
	phone: string;
	whatsapp: string;
	serviceStartAt: string;
	serviceEndAt: string;
};

export class CreateBakeryUseCase {
	constructor(
		private bakeryRepository: BakeryRepository,
		private userRepository: UserRepository,
		private bakeryPersonRepository: BakeryPersonRepository,
	) {}

	async execute(
		callerSupabaseUserId: string,
		data: CreateBakeryInput,
	): Promise<Bakery> {
		const user = await this.userRepository.findBySupabaseUserId(
			callerSupabaseUserId,
		);
		if (!user) {
			throw new NotFoundError('Usuário não encontrado');
		}

		const existingBakeryPerson = await this.bakeryPersonRepository.findByUserId(
			user.id,
		);
		if (existingBakeryPerson) {
			throw new ConflictError('Usuário já está vinculado a uma padaria');
		}

		const existingBakery = await this.bakeryRepository.findByCnpj(data.cnpj);
		if (existingBakery) {
			throw new ConflictError('CNPJ já está em uso');
		}

		const bakery = await this.bakeryRepository.create(data);

		await this.bakeryPersonRepository.create({
			userId: user.id,
			bakeryId: bakery.id!,
		});

		return bakery;
	}
}
