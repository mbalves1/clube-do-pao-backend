import {
	BakeryPersonRepository,
	CreateBakeryPersonData,
} from '../../core/ports/bakery-person-repository';
import { prisma } from '../database/prisma-client';
import { toBakeryPerson } from '../mappers/prisma-bakery-person-mapper';

export class PrismaBakeryPersonRepository implements BakeryPersonRepository {
	async create(data: CreateBakeryPersonData) {
		const created = await prisma.bakeryPerson.create({
			data: {
				userId: data.userId,
				bakeryId: data.bakeryId,
			},
		});

		return toBakeryPerson(created);
	}

	async findByUserId(userId: string) {
		const found = await prisma.bakeryPerson.findUnique({
			where: { userId },
		});

		return found ? toBakeryPerson(found) : null;
	}
}
