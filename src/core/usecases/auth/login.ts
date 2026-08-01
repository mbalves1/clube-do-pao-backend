import { UnprocessableEntityError } from '../../errors/UnprocessableEntityError';
import { AuthGateway, Role } from '../../ports/auth-gateway';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { UserRepository } from '../../ports/user-repository';
import { Profile, resolveProfile } from './resolve-profile';

export type LoginDTO = {
	email: string;
	password: string;
};

export type LoginProfile = Profile;

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
		private bakeryPersonRepository: BakeryPersonRepository,
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
		const profile = await resolveProfile(role, supabaseUserId, {
			userRepository: this.userRepository,
			bakeryPersonRepository: this.bakeryPersonRepository,
			deliveryUserRepository: this.deliveryUserRepository,
		});

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
}
