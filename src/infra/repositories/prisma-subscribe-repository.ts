import { prisma } from './../database/prisma-client';
import { OrderStatus } from '../../core/entities/orders';
import {
	AvailableOrder,
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

	async getOrder(idUser: string): Promise<any> {
		return prisma.subscription.findMany({
			where: {
				userId: idUser,
			},
		});
	}

	async getOrderByDay(startOfDay: Date, endOfDay: Date): Promise<any> {
		return prisma.subscription.findMany({
			where: {
				serviceDate: {
					gte: startOfDay,
					lt: endOfDay,
				},
			},
		});
	}

	async updateOrder(
		orderId: number,
		deliveryId: string,
		status: OrderStatus,
	): Promise<any> {
		return prisma.subscription.update({
			where: { id: orderId },
			data: {
				deliveryPersonId: deliveryId,
				status,
			},
		});
	}

	async getSubscribeById(orderId: number): Promise<any> {
		return prisma.subscription.findFirst({
			where: {
				id: orderId,
			},
		});
	}

	async getAll(
		page: number,
		limit: number,
		serviceDate?: string,
	): Promise<any> {
		const skip = (page - 1) * limit;

		const where: any = {};

		if (serviceDate) {
			const date = new Date(serviceDate);

			const startOfDay = new Date(date);
			startOfDay.setHours(0, 0, 0, 0);

			const endOfDay = new Date(date);
			endOfDay.setHours(23, 59, 59, 999);

			where.serviceDate = {
				gte: startOfDay,
				lte: endOfDay,
			};
		}

		const [data, total] = await Promise.all([
			prisma.subscription.findMany({
				where,
				skip,
				take: limit,
			}),
			prisma.subscription.count({
				where,
			}),
		]);

		return {
			data,
			page,
			limit,
			total,
			totalPages: Math.ceil(total / limit),
		};
	}

	async findAvailable(startDate: Date, endDate: Date): Promise<AvailableOrder[]> {
		const rows = await prisma.subscription.findMany({
			where: {
				serviceDate: { gte: startDate, lte: endDate },
				deliveryPersonId: null,
			},
		});

		return rows.map((row) => ({
			id: row.id,
			bakeryId: row.bakeryId,
			serviceDate: row.serviceDate,
			serviceStartAt: row.serviceStartAt,
			serviceEndAt: row.serviceEndAt,
			deliveryStartAt: row.deliveryStartAt,
			deliveryEndAt: row.deliveryEndAt,
			status: row.status as OrderStatus,
		}));
	}

	async claim(id: number, deliveryPersonId: string): Promise<boolean> {
		const { count } = await prisma.subscription.updateMany({
			where: { id, deliveryPersonId: null },
			data: { deliveryPersonId, status: 'ACCEPTED' },
		});

		return count === 1;
	}

	async release(id: number, deliveryPersonId: string): Promise<boolean> {
		const { count } = await prisma.subscription.updateMany({
			where: { id, deliveryPersonId, status: 'ACCEPTED' },
			data: { deliveryPersonId: null, status: 'PENDING' },
		});

		return count === 1;
	}
}
