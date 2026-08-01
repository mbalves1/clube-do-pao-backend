import { DeliveryUser } from '../../core/entities/delivery';
import {
	CreateDeliveryUserData,
	DeliveryUserRepository,
} from '../../core/ports/delivery-user-repository';
import { prisma } from '../database/prisma-client';

export class PrismaDeliveryUserRepository implements DeliveryUserRepository {
	async create(data: CreateDeliveryUserData): Promise<DeliveryUser> {
		const created = await prisma.deliveryPerson.create({
			data: {
				userId: data.userId,
				document: data.document,
				phone: data.phone,
				modal: data.modal,
			},
		});

		return {
			id: created.id,
			userId: created.userId,
			document: created.document,
			phone: created.phone,
			modal: created.modal,
			status: created.status,
		};
	}

	async findByUserId(userId: string): Promise<DeliveryUser | null> {
		const found = await prisma.deliveryPerson.findUnique({
			where: { userId },
		});

		if (!found) {
			return null;
		}

		return {
			id: found.id,
			userId: found.userId,
			document: found.document,
			phone: found.phone,
			modal: found.modal,
			status: found.status,
		};
	}
}
