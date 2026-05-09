import { User } from '../../entities/user';
import { UserRepository } from '../../ports/user-repository';

export type CreateUserDTO = {
	name: string;
	email: string;
};

export class CreateUserUseCase {
	constructor(private userRepository: UserRepository) {}

	async execute(data: CreateUserDTO): Promise<User> {
		const existingUser = await this.userRepository.findByEmail(data.email);
		if (existingUser) {
			throw new Error('Email já está em uso');
		}

		const user: Omit<User, 'id'> = {
			name: data.name,
			email: data.email,
			createdAt: new Date(),
		};

		return this.userRepository.create(user);
	}
}
