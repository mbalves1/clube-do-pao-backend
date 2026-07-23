import { UnprocessableEntityError } from '../../errors/UnprocessableEntityError';
import { AuthGateway, Role } from '../../ports/auth-gateway';
import { BakeryRepository } from '../../ports/bakery-repository';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { UserRepository } from '../../ports/user-repository';

export type LoginDTO = {
	email: string;
	password: string;
};

export type LoginProfile = {
	id: string;
	name: string;
	email: string;
};

export type LoginResult = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	role: Role;
	profile: LoginProfile;
};

const INVALID_CREDENTIALS_MESSAGE = 'Email ou senha inválidos';

export class LoginUseCase {
	constructor(
		private authGateway: AuthGateway,
		private userRepository: UserRepository,
		private bakeryRepository: BakeryRepository,
		private deliveryUserRepository: DeliveryUserRepository,
	) {}

	async execute(data: LoginDTO): Promise<LoginResult> {
		let session;
		try {
			session = await this.authGateway.signInWithPassword(
				data.email,
				data.password,
			);
		} catch {
			throw new UnprocessableEntityError(INVALID_CREDENTIALS_MESSAGE);
		}

		const { supabaseUserId, role } = session;
		const profile = await this.findProfile(role, supabaseUserId);

		if (!profile) {
			throw new UnprocessableEntityError(INVALID_CREDENTIALS_MESSAGE);
		}

		return {
			accessToken: session.accessToken,
			refreshToken: session.refreshToken,
			expiresIn: session.expiresIn,
			role,
			profile,
		};
	}

	private async findProfile(
		role: Role,
		supabaseUserId: string,
	): Promise<LoginProfile | null> {
		switch (role) {
			case 'customer': {
				const user =
					await this.userRepository.findBySupabaseUserId(supabaseUserId);
				return user && { id: user.id, name: user.name, email: user.email };
			}
			case 'company': {
				const bakery =
					await this.bakeryRepository.findBySupabaseUserId(supabaseUserId);
				return (
					bakery && {
						id: bakery.id as string,
						name: bakery.name,
						email: bakery.email,
					}
				);
			}
			case 'delivery': {
				const deliveryUser =
					await this.deliveryUserRepository.findBySupabaseUserId(supabaseUserId);
				return (
					deliveryUser && {
						id: deliveryUser.id,
						name: deliveryUser.name,
						email: deliveryUser.email,
					}
				);
			}
		}
	}
}
