import { prisma } from './../database/prisma-client';
import {
	SubscribeCreateData,
	SubscribeRepository,
} from '../../core/ports/subscribe-repository';

export class PrismaSubscribeRepository implements SubscribeRepository {
	async create(data: SubscribeCreateData) {
		return prisma.subscription.create({
			data: {
				userId: data.userId,
				bakeryId: data.bakeryId,
				serviceDate: data.serviceDate,
				serviceStartAt: data.serviceStartAt,
				serviceEndAt: data.serviceEndAt,
				status: data.status,
				notes: data.notes,
			},
		});
	}
}
