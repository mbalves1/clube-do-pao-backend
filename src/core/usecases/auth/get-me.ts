import { Role } from '../../ports/auth-gateway';
import { BakeryRepository } from '../../ports/bakery-repository';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { UserRepository } from '../../ports/user-repository';
import { Profile, resolveProfile } from './resolve-profile';

export class GetMeUseCase {
	constructor(
		private userRepository: UserRepository,
		private bakeryRepository: BakeryRepository,
		private deliveryUserRepository: DeliveryUserRepository,
	) {}

	async execute(role: Role, supabaseUserId: string): Promise<Profile | null> {
		return resolveProfile(role, supabaseUserId, {
			userRepository: this.userRepository,
			bakeryRepository: this.bakeryRepository,
			deliveryUserRepository: this.deliveryUserRepository,
		});
	}
}
