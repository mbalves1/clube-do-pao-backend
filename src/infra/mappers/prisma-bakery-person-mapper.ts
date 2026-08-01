import { BakeryPerson as PrismaBakeryPerson } from '@prisma/client';
import { BakeryPerson } from '../../core/entities/bakery-person';

export function toBakeryPerson(
	prismaBakeryPerson: PrismaBakeryPerson,
): BakeryPerson {
	return {
		id: prismaBakeryPerson.id,
		userId: prismaBakeryPerson.userId,
		bakeryId: prismaBakeryPerson.bakeryId,
		createdAt: prismaBakeryPerson.createdAt,
	};
}
