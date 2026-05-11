import { Bakery as PrismaBakery } from '@prisma/client';
import { Bakery } from '../../core/entities/bakery';

export function toBakery(prismaBakery: PrismaBakery): Bakery {
	return {
		id: prismaBakery.id,
		name: prismaBakery.name,
		cnpj: prismaBakery.cnpj,
		email: prismaBakery.email,
		phone: prismaBakery.phone,
		whatsapp: prismaBakery.whatsapp,
		serviceStartAt: prismaBakery.serviceStartAt,
		serviceEndAt: prismaBakery.serviceEndAt,
		createdAt: prismaBakery.createdAt,
	};
}
