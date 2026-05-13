import { BakeryCreateData } from '../../core/mappers/bakery-mapper';
import { BakeryRepository } from '../../core/ports/bakery-repository';
import { prisma } from '../database/prisma-client';
import { toBakery } from '../mappers/prisma-bakery-mapper';

export class PrismaBakeryRepository implements BakeryRepository {
	async find() {
		const found = await prisma.bakery.findMany();

		return found.map(toBakery);
	}

	async findByCnpj(cnpj: string) {
		const found = await prisma.bakery.findFirst({
			where: { cnpj },
		});

		return found ? toBakery(found) : null;
	}

	async findUnique(id: string) {
		const found = await prisma.bakery.findFirst({
			where: { id },
		});

		return found ? toBakery(found) : null;
	}

	async create(bakery: BakeryCreateData) {
		const created = await prisma.bakery.create({
			data: {
				name: bakery.name,
				cnpj: bakery.cnpj,
				email: bakery.email,
				phone: bakery.phone,
				whatsapp: bakery.whatsapp,
				serviceStartAt: bakery.serviceStartAt,
				serviceEndAt: bakery.serviceEndAt,
			},
		});

		return toBakery(created);
	}
}
