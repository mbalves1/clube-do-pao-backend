import { UnprocessableEntityError } from '../../errors/UnprocessableEntityError';
import { User } from '../../entities/user';
import { AuthGateway, Role } from '../../ports/auth-gateway';
import { UserRepository } from '../../ports/user-repository';

export type CreateUserDTO = {
	name: string;
	email: string;
	password: string;
	role: Role;
};

export class CreateUserUseCase {
	constructor(
		private userRepository: UserRepository,
		private authGateway: AuthGateway,
	) {}

	async execute(data: CreateUserDTO): Promise<User> {
		const existingUser = await this.userRepository.findByEmail(data.email);
		if (existingUser) {
			throw new Error('Email já está em uso');
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

		const user: Omit<User, 'id'> = {
			name: data.name,
			email: data.email,
			supabaseUserId,
			createdAt: new Date(),
		};

		return this.userRepository.create(user);
	}
}
