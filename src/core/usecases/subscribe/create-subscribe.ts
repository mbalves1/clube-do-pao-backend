import { BakeryRepository } from '../../ports/bakery-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';
import { UserRepository } from '../../ports/user-repository';

interface CreateSubscribeInput {
	start: string;
	end: string;
	notes?: string;
	serviceDate?: string | Date;
}

export class CreateSubscribeUseCase {
	constructor(
		private userRepository: UserRepository,
		private bakeryRepository: BakeryRepository,
		private subscribeRepository: SubscribeRepository,
	) {}

	async execute(
		idUser: string,
		idBakery: string,
		subscribe: CreateSubscribeInput,
	): Promise<any> {
		const existingUser = await this.userRepository.findById(idUser);
		if (!existingUser) {
			throw new Error('usuario nao encontrado');
		}

		const existBakery = await this.bakeryRepository.findUnique(idBakery);
		if (!existBakery) {
			throw new Error('padaria nao encontrado');
		}

		return this.subscribeRepository.create({
			userId: idUser,
			bakeryId: idBakery,
			serviceDate: subscribe.serviceDate
				? new Date(subscribe.serviceDate)
				: new Date(),
			serviceStartAt: subscribe.start,
			serviceEndAt: subscribe.end,
			status: 'pending',
			notes: subscribe.notes,
		});
	}
}
