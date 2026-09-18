import { Order, OrderStatus } from '../../core/entities/orders';
import {
	BakeryOrderFilters,
	GenerateOrderInput,
	OrdersRepository,
	OrderStatusPatch,
} from '../../core/ports/orders-repository';
import { prisma } from '../database/prisma-client';
import { toOrder } from '../mappers/prisma-orders-mapper';

const ITEMS_INCLUDE = { items: true } as const;

export class PrismaOrdersRepository implements OrdersRepository {
	async createFromSubscription(input: GenerateOrderInput): Promise<Order> {
		const created = await prisma.order.create({
			data: {
				subscription: { connect: { id: input.subscriptionId } },
				bakery: { connect: { id: input.bakeryId } },
				serviceDate: input.serviceDate,
				fulfillmentType: input.fulfillmentType,
				items: {
					create: input.items.map((item) => ({
						itemId: item.itemId,
						nameSnapshot: item.nameSnapshot,
						priceCentsSnapshot: item.priceCentsSnapshot,
						quantity: item.quantity,
					})),
				},
			},
			include: ITEMS_INCLUDE,
		});

		return toOrder(created);
	}

	async existsForSubscriptionAndDate(
		subscriptionId: number,
		serviceDate: Date,
	): Promise<boolean> {
		const count = await prisma.order.count({
			where: { subscriptionId, serviceDate },
		});

		return count > 0;
	}

	async findByIdWithItems(id: number): Promise<Order | null> {
		const found = await prisma.order.findUnique({
			where: { id },
			include: ITEMS_INCLUDE,
		});

		return found ? toOrder(found) : null;
	}

	async listByBakery(
		bakeryId: string,
		filters: BakeryOrderFilters,
	): Promise<Order[]> {
		const found = await prisma.order.findMany({
			where: {
				bakeryId,
				status: filters.status,
				serviceDate:
					filters.serviceDateFrom || filters.serviceDateTo
						? {
								gte: filters.serviceDateFrom,
								lte: filters.serviceDateTo,
							}
						: undefined,
			},
			include: ITEMS_INCLUDE,
			orderBy: [{ serviceDate: 'asc' }, { createdAt: 'asc' }],
		});

		return found.map(toOrder);
	}

	async findByDateRange(from: Date, to: Date): Promise<Order[]> {
		const found = await prisma.order.findMany({
			where: { serviceDate: { gte: from, lte: to } },
			include: ITEMS_INCLUDE,
		});

		return found.map(toOrder);
	}

	async findAvailableForDelivery(from: Date, to: Date): Promise<Order[]> {
		const found = await prisma.order.findMany({
			where: {
				status: 'READY',
				fulfillmentType: 'DELIVERY',
				deliveryPersonId: null,
				serviceDate: { gte: from, lte: to },
			},
			include: ITEMS_INCLUDE,
		});

		return found.map(toOrder);
	}

	async updateStatus(
		id: number,
		status: OrderStatus,
		patch: OrderStatusPatch,
	): Promise<Order> {
		const updated = await prisma.order.update({
			where: { id },
			data: { status, ...patch },
			include: ITEMS_INCLUDE,
		});

		return toOrder(updated);
	}

	async claim(id: number, deliveryPersonId: string): Promise<boolean> {
		const { count } = await prisma.order.updateMany({
			where: { id, status: 'READY', deliveryPersonId: null },
			data: { deliveryPersonId, status: 'ACCEPTED', acceptedAt: new Date() },
		});

		return count === 1;
	}

	async release(id: number, deliveryPersonId: string): Promise<boolean> {
		const { count } = await prisma.order.updateMany({
			where: { id, deliveryPersonId, status: 'ACCEPTED' },
			data: { deliveryPersonId: null, status: 'READY', acceptedAt: null },
		});

		return count === 1;
	}
}
