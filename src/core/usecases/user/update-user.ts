import { User } from '../../entities/user';
import { UserRepository } from '../../ports/user-repository';

export type UpdateUserDTO = {
	id: string;
	name?: string;
	email?: string;
	phone?: string;
	zipCode?: string;
	street?: string;
	number?: string;
	district?: string;
	city?: string;
	state?: string;
};

export class UpdateUserUseCase {
	constructor(private userRepository: UserRepository) {}

	async execute(data: UpdateUserDTO): Promise<User> {
		if (data.email) {
			const existingUser = await this.userRepository.findByEmail(data.email);
			if (existingUser && existingUser.id !== data.id) {
				throw new Error('Email já está em uso');
			}
		}

		return this.userRepository.update(data);
	}
}
