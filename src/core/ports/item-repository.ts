import { Item } from '../entities/item';

export type CreateItemData = {
	bakeryId: string;
	name: string;
	description?: string | null;
	priceCents: number;
	available?: boolean;
};

export type UpdateItemData = Partial<
	Omit<Item, 'id' | 'bakeryId' | 'createdAt' | 'updatedAt'>
>;

export interface ItemRepository {
	create(data: CreateItemData): Promise<Item>;
	update(id: string, data: UpdateItemData): Promise<Item>;
	delete(id: string): Promise<void>;
	findById(id: string): Promise<Item | null>;
	findByBakeryId(bakeryId: string): Promise<Item[]>;
}
