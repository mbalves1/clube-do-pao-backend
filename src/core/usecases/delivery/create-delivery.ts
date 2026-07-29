import { UnprocessableEntityError } from '../../errors/UnprocessableEntityError';
import { DeliveryUser } from '../../entities/delivery';
import { AuthGateway } from '../../ports/auth-gateway';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';

export type CreateDeliveryUserDTO = {
	name: string;
	document: string;
	email: string;
	phone: string;
	modal: 'BIKE' | 'MOTORCYCLE' | 'WALKING';
	password: string;
};

export class CreateDeliveryUserUseCase {
	constructor(
		private deliveryRepository: DeliveryUserRepository,
		private authGateway: AuthGateway,
	) {}

	async execute(data: CreateDeliveryUserDTO): Promise<DeliveryUser> {
		let supabaseUserId: string;
		try {
			const credential = await this.authGateway.createCredential(
				data.email,
				data.password,
				'delivery',
			);
			supabaseUserId = credential.supabaseUserId;
		} catch {
			throw new UnprocessableEntityError(
				'Não foi possível criar a credencial de autenticação',
			);
		}

		return this.deliveryRepository.create({
			name: data.name,
			document: data.document,
			email: data.email,
			phone: data.phone,
			modal: data.modal,
			supabaseUserId,
		});
	}
}
