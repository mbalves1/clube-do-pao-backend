import { BakeryRepository } from '../../ports/bakery-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';
import { UserRepository } from '../../ports/user-repository';

interface CreateSubscribeInput {
	frequency: 'daily' | 'weekly' | 'monthly';
	deliveryStartAt: string;
	deliveryEndAt: string;
	serviceStartAt: string;
	serviceEndAt: string;
	notes: string;
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

		const dayStart = Number(subscribe.serviceStartAt.split('-')[0]);
		const dayEnd = Number(subscribe.serviceEndAt.split('-')[0]);

		if (subscribe.frequency === 'daily') {
			for (let i = dayStart; i <= dayEnd; i++) {
				this.subscribeRepository.create({
					userId: idUser,
					bakeryId: idBakery,
					serviceDate: new Date(),
					serviceStartAt: subscribe.serviceStartAt,
					serviceEndAt: subscribe.serviceEndAt,
					frequency: subscribe.frequency,
					deliveryStartAt: subscribe.deliveryStartAt,
					deliveryEndAt: subscribe.deliveryEndAt,
					status: 'PENDING',
					notes: subscribe.notes,
				});
			}
		} else {
			return this.subscribeRepository.create({
				userId: idUser,
				bakeryId: idBakery,
				serviceDate: new Date(),
				serviceStartAt: subscribe.deliveryStartAt,
				serviceEndAt: subscribe.deliveryEndAt,
				frequency: subscribe.frequency,
				deliveryStartAt: subscribe.deliveryStartAt,
				deliveryEndAt: subscribe.deliveryEndAt,
				status: 'PENDING',
				notes: subscribe.notes,
			});
		}
	}
}
