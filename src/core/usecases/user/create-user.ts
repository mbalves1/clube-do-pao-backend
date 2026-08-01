import { UnprocessableEntityError } from '../../errors/UnprocessableEntityError';
import { User } from '../../entities/user';
import { AuthGateway } from '../../ports/auth-gateway';
import { UserRepository } from '../../ports/user-repository';
import { BakeryRepository } from '../../ports/bakery-repository';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';

export type CreateUserDTO =
	| {
			role: 'customer';
			name: string;
			email: string;
			password: string;
	  }
	| {
			role: 'company';
			name: string;
			email: string;
			password: string;
			businessName: string;
			cnpj: string;
			phone: string;
			whatsapp: string;
			serviceStartAt: string;
			serviceEndAt: string;
	  }
	| {
			role: 'delivery';
			name: string;
			email: string;
			password: string;
			document: string;
			phone: string;
			modal: 'BIKE' | 'MOTORCYCLE' | 'WALKING';
	  };

export class CreateUserUseCase {
	constructor(
		private userRepository: UserRepository,
		private authGateway: AuthGateway,
		private bakeryRepository: BakeryRepository,
		private bakeryPersonRepository: BakeryPersonRepository,
		private deliveryUserRepository: DeliveryUserRepository,
	) {}

	async execute(data: CreateUserDTO): Promise<User> {
		const existingUser = await this.userRepository.findByEmail(data.email);
		if (existingUser) {
			throw new Error('Email já está em uso');
		}

		if (data.role === 'company') {
			const existingBakery = await this.bakeryRepository.findByCnpj(
				data.cnpj,
			);
			if (existingBakery) {
				throw new Error('CNPJ já está em uso');
			}
		}

		let supabaseUserId: string;
		try {
			const credential = await this.authGateway.createCredential(
				data.email,
				data.password,
				data.role,
			);
			supabaseUserId = credential.supabaseUserId;
		} catch {
			throw new UnprocessableEntityError(
				'Não foi possível criar a credencial de autenticação',
			);
		}

		const user = await this.userRepository.create({
			name: data.name,
			email: data.email,
			supabaseUserId,
			createdAt: new Date(),
		});

		if (data.role === 'company') {
			const bakery = await this.bakeryRepository.create({
				name: data.businessName,
				cnpj: data.cnpj,
				email: data.email,
				phone: data.phone,
				whatsapp: data.whatsapp,
				serviceStartAt: data.serviceStartAt,
				serviceEndAt: data.serviceEndAt,
			});

			await this.bakeryPersonRepository.create({
				userId: user.id,
				bakeryId: bakery.id!,
			});
		}

		if (data.role === 'delivery') {
			await this.deliveryUserRepository.create({
				userId: user.id,
				document: data.document,
				phone: data.phone,
				modal: data.modal,
			});
		}

		return user;
	}
}
