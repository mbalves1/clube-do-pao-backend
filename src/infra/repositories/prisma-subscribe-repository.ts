import { prisma } from './../database/prisma-client';
import {
	SubscribeCreateData,
	SubscribeRepository,
} from '../../core/ports/subscribe-repository';

export class PrismaSubscribeRepository implements SubscribeRepository {
	async create(data: SubscribeCreateData) {
		return await prisma.subscription.create({
			data: {
				userId: data.userId,
				bakeryId: data.bakeryId,
				serviceDate: data.serviceDate,
				serviceStartAt: data.serviceStartAt,
				serviceEndAt: data.serviceEndAt,
				frequency: data.frequency,
				daysWeek: data.daysWeek ?? [],
				deliveryStartAt: data.deliveryStartAt,
				deliveryEndAt: data.deliveryEndAt,
				status: data.status,
				notes: data.notes,
			},
		});
	}

	async getList(idUser: string): Promise<any> {
		return prisma.subscription.findMany({
			where: {
				userId: idUser,
			},
		});
	}
}
