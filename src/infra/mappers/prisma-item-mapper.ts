import { Item as PrismaItem } from '@prisma/client';
import { Item } from '../../core/entities/item';

export function toItem(prismaItem: PrismaItem): Item {
	return {
		id: prismaItem.id,
		bakeryId: prismaItem.bakeryId,
		name: prismaItem.name,
		description: prismaItem.description,
		priceCents: prismaItem.priceCents,
		available: prismaItem.available,
		createdAt: prismaItem.createdAt,
		updatedAt: prismaItem.updatedAt,
	};
}
