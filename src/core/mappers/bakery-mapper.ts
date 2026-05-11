import { Bakery } from '../entities/bakery';

export type BakeryCreateData = Omit<Bakery, 'id' | 'createdAt'>;

export function toBakery(data: BakeryCreateData): Bakery {
	return {
		name: data.name,
		cnpj: data.cnpj,
		email: data.email,
		phone: data.phone,
		whatsapp: data.whatsapp,
		serviceStartAt: data.serviceStartAt,
		serviceEndAt: data.serviceEndAt,
	};
}
