import { ForbiddenError } from '../../errors/ForbiddenError';
import { NotFoundError } from '../../errors/NotFoundError';
import { BakeryPersonRepository } from '../../ports/bakery-person-repository';
import { UserRepository } from '../../ports/user-repository';

/**
 * Resolves the bakeryId a "company" (lojista) caller is allowed to manage
 * items for, from their Supabase user id — mirrors the User -> BakeryPerson
 * lookup already done in `resolve-profile.ts` for GET /auth/me.
 */
export async function resolveOwnerBakeryId(
	callerSupabaseUserId: string,
	userRepository: UserRepository,
	bakeryPersonRepository: BakeryPersonRepository,
): Promise<string> {
	const user = await userRepository.findBySupabaseUserId(
		callerSupabaseUserId,
	);
	if (!user) {
		throw new NotFoundError('Usuário não encontrado');
	}

	const bakeryPerson = await bakeryPersonRepository.findByUserId(user.id);
	if (!bakeryPerson) {
		throw new ForbiddenError('Usuário não está vinculado a uma padaria');
	}

	return bakeryPerson.bakeryId;
}
