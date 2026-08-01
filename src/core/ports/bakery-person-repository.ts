import { BakeryPerson } from '../entities/bakery-person';

export type CreateBakeryPersonData = {
	userId: string;
	bakeryId: string;
};

export interface BakeryPersonRepository {
	create(data: CreateBakeryPersonData): Promise<BakeryPerson>;
	findByUserId(userId: string): Promise<BakeryPerson | null>;
}
