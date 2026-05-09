import { UserRepository } from '../../ports/user-repository';

export type CreateUserDTO = {
	name: string;
	email: string;
};

export class GetUserUseCase {
	constructor(private userRepository: UserRepository) {}

	async execute(data: CreateUserDTO): Promise<any> {
		const existingUser = await this.userRepository.find();
		console.log('exixsint', existingUser);
		return existingUser;
	}
}
