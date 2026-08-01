import { Role } from '../../ports/auth-gateway';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { DeliveryUserRepository } from '../../ports/delivery-user-repository';
import { UserRepository } from '../../ports/user-repository';

export type Profile = {
	id: string;
	name: string;
	email: string;
	bakeryId?: string;
	deliveryPersonId?: string;
};

export type ProfileRepositories = {
	userRepository: UserRepository;
	bakeryPersonRepository: BakeryPersonRepository;
	deliveryUserRepository: DeliveryUserRepository;
};

export async function resolveProfile(
	role: Role,
	supabaseUserId: string,
	repositories: ProfileRepositories,
): Promise<Profile | null> {
	const user =
		await repositories.userRepository.findBySupabaseUserId(supabaseUserId);
	if (!user) {
		return null;
	}

	switch (role) {
		case 'customer':
			return { id: user.id, name: user.name, email: user.email };
		case 'company': {
			const bakeryPerson =
				await repositories.bakeryPersonRepository.findByUserId(user.id);
			return (
				bakeryPerson && {
					id: user.id,
					name: user.name,
					email: user.email,
					bakeryId: bakeryPerson.bakeryId,
				}
			);
		}
		case 'delivery': {
			const deliveryPerson =
				await repositories.deliveryUserRepository.findByUserId(user.id);
			return (
				deliveryPerson && {
					id: user.id,
					name: user.name,
					email: user.email,
					deliveryPersonId: deliveryPerson.id,
				}
			);
		}
	}
}
