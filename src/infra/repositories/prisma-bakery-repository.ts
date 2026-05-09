import { Bakery } from '../../core/entities/bakery';
import { BakeryRepository } from '../../core/ports/bakery-repository';
import { prisma } from '../database/prisma-client';

export class PrismaBakeryRepository implements BakeryRepository {
	async find(): Promise<Bakery[]> {
		const found = await prisma.bakery.findMany();

		return found.map((bakery) => ({
			id: bakery.id,
			name: bakery.name,
			cnpj: bakery.cnpj,
			email: bakery.email,
			phone: bakery.phone,
			whatsapp: bakery.whatsapp,
			serviceStartAt: bakery.serviceStartAt,
			serviceEndAt: bakery.serviceEndAt,
			createdAt: bakery.createdAt,
		}));
	}

	async findByCnpj(cnpj: string): Promise<Bakery | null> {
		const found = await prisma.bakery.findFirst({
			where: { cnpj },
		});

		if (!found) {
			return null;
		}

		return {
			id: found.id,
			name: found.name,
			cnpj: found.cnpj,
			email: found.email,
			phone: found.phone,
			whatsapp: found.whatsapp,
			serviceStartAt: found.serviceStartAt,
			serviceEndAt: found.serviceEndAt,
			createdAt: found.createdAt,
		};
	}

	async create(bakery: Bakery): Promise<Bakery> {
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

		return {
			id: created.id,
			name: created.name,
			cnpj: created.cnpj,
			email: created.email,
			phone: created.phone,
			whatsapp: created.whatsapp,
			serviceStartAt: created.serviceStartAt,
			serviceEndAt: created.serviceEndAt,
			createdAt: created.createdAt,
		};
	}
}
