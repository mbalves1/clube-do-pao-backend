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
}
