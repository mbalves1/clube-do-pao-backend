import { prisma } from './../database/prisma-client';
import { FulfillmentType } from '../../core/entities/orders';
import { SubscriptionItem } from '../../core/entities/subscription-item';
import {
	SubscribeCreateData,
	SubscribeRepository,
	SubscriptionTemplateForDate,
} from '../../core/ports/subscribe-repository';

const WEEK_DAY_NAMES = [
	'sunday',
	'monday',
	'tuesday',
	'wednesday',
	'thursday',
	'friday',
	'saturday',
];

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
				fulfillmentType: data.fulfillmentType,
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

	async listActiveTemplatesForDate(
		date: Date,
	): Promise<SubscriptionTemplateForDate[]> {
		const weekDayName = WEEK_DAY_NAMES[date.getDay()];

		const subscriptions = await prisma.subscription.findMany({
			where: {
				active: true,
				OR: [{ frequency: 'daily' }, { daysWeek: { has: weekDayName } }],
			},
			include: {
				items: { include: { item: true } },
			},
		});

		return subscriptions.map((subscription) => ({
			id: subscription.id,
			bakeryId: subscription.bakeryId,
			userId: subscription.userId,
			serviceDate: date,
			fulfillmentType: subscription.fulfillmentType as FulfillmentType,
			items: subscription.items
				.filter((subscriptionItem) => subscriptionItem.item)
				.map((subscriptionItem) => ({
					itemId: subscriptionItem.itemId,
					nameSnapshot: subscriptionItem.item.name,
					priceCentsSnapshot: subscriptionItem.item.priceCents,
					quantity: subscriptionItem.quantity,
				})),
		}));
	}

	async getItems(subscriptionId: number): Promise<SubscriptionItem[]> {
		return prisma.subscriptionItem.findMany({
			where: { subscriptionId },
		});
	}

	async setItems(
		subscriptionId: number,
		items: { itemId: string; quantity: number }[],
	): Promise<void> {
		const deduped = Array.from(
			new Map(items.map((item) => [item.itemId, item])).values(),
		);

		await prisma.$transaction([
			prisma.subscriptionItem.deleteMany({ where: { subscriptionId } }),
			prisma.subscriptionItem.createMany({
				data: deduped.map((item) => ({
					subscriptionId,
					itemId: item.itemId,
					quantity: item.quantity,
				})),
			}),
		]);
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

}
