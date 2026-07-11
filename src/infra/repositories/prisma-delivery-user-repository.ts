import { DeliveryUser } from '../../core/entities/delivery';
import { DeliveryUserRepository } from '../../core/ports/delivery-user-repository';
import { prisma } from '../database/prisma-client';

export class PrismaDeliveryUserRepository implements DeliveryUserRepository {
	async create(data: any): Promise<any> {
		return await prisma.deliveryPerson.create({
			data: {
				name: data.name,
				document: data.document,
				email: data.email,
				phone: data.phone,
				modal: data.modal,
			},
		});
	}

	async findBySupabaseUserId(
		supabaseUserId: string,
	): Promise<DeliveryUser | null> {
		const found = await prisma.deliveryPerson.findUnique({
			where: { supabaseUserId },
		});

		if (!found) {
			return null;
		}

		return {
			id: found.id,
			name: found.name,
			email: found.email!,
			supabaseUserId: found.supabaseUserId!,
		};
	}
}
