import { Role } from '../../ports/auth-gateway';
import { BakeryRepository } from '../../ports/bakery-repository';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { UserRepository } from '../../ports/user-repository';

export type Profile = {
	id: string;
	name: string;
	email: string;
};

export type ProfileRepositories = {
	userRepository: UserRepository;
	bakeryRepository: BakeryRepository;
	deliveryUserRepository: DeliveryUserRepository;
};

export async function resolveProfile(
	role: Role,
	supabaseUserId: string,
	repositories: ProfileRepositories,
): Promise<Profile | null> {
	switch (role) {
		case 'customer': {
			const user =
				await repositories.userRepository.findBySupabaseUserId(supabaseUserId);
			return user && { id: user.id, name: user.name, email: user.email };
		}
		case 'company': {
			const bakery =
				await repositories.bakeryRepository.findBySupabaseUserId(
					supabaseUserId,
				);
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
				await repositories.deliveryUserRepository.findBySupabaseUserId(
					supabaseUserId,
				);
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
