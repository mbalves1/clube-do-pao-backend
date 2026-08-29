import { Item } from '../../core/entities/item';
import {
	CreateItemData,
	ItemRepository,
	UpdateItemData,
} from '../../core/ports/item-repository';
import { prisma } from '../database/prisma-client';
import { toItem } from '../mappers/prisma-item-mapper';

export class PrismaItemRepository implements ItemRepository {
	async create(data: CreateItemData): Promise<Item> {
		const created = await prisma.item.create({
			data: {
				bakeryId: data.bakeryId,
				name: data.name,
				description: data.description ?? null,
				priceCents: data.priceCents,
				available: data.available ?? true,
			},
		});

		return toItem(created);
	}

	async update(id: string, data: UpdateItemData): Promise<Item> {
		const updated = await prisma.item.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description,
				priceCents: data.priceCents,
				available: data.available,
			},
		});

		return toItem(updated);
	}

	async delete(id: string): Promise<void> {
		await prisma.item.delete({ where: { id } });
	}

	async findById(id: string): Promise<Item | null> {
		const found = await prisma.item.findUnique({ where: { id } });

		return found ? toItem(found) : null;
	}

	async findByBakeryId(bakeryId: string): Promise<Item[]> {
		const found = await prisma.item.findMany({
			where: { bakeryId },
			orderBy: { createdAt: 'desc' },
		});

		return found.map(toItem);
	}
}
