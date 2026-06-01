import { OrderStatus } from '@prisma/client';
import { Order } from '../../core/entities/orders';
import {
	CreateOrderData,
	OrdersRepository,
	UpdateOrderData,
} from '../../core/ports/orders-repository';
import { prisma } from '../database/prisma-client';

function mapOrder(order: any): Order {
	return {
		id: order.id,
		subscriptionId: order.subscriptionId,
		deliveryPersonId: order.deliveryPersonId ?? null,
		serviceDate: order.serviceDate,
		status: (order.status as Order['status']) ?? null,
		acceptedAt: order.acceptedAt ?? null,
		pickedUpAt: order.pickedUpAt ?? null,
		deliveredAt: order.deliveredAt ?? null,
		canceledAt: order.canceledAt ?? null,
		createdAt: order.createdAt,
		updatedAt: order.updatedAt,
	};
}

export class PrismaOrdersRepository implements OrdersRepository {
	async create(order: any, deliveryId: string): Promise<Order> {
		const created = await prisma.order.create({
			data: {
				subscription: { connect: { id: order.id } },
				deliveryPerson: deliveryId
					? { connect: { id: deliveryId } }
					: undefined,
				serviceDate: order.serviceDate,
				status: (order.status as any) ?? OrderStatus.PENDING,
				acceptedAt: new Date(),
				pickedUpAt: order.pickedUpAt ?? null,
				deliveredAt: order.deliveredAt ?? null,
				canceledAt: order.canceledAt ?? null,
			},
		});

		return mapOrder(created);
	}

	async update(order: UpdateOrderData): Promise<Order> {
		const updated = await prisma.order.update({
			where: {
				id: order.id,
			},
			data: {
				subscriptionId: order.subscriptionId,
				deliveryPersonId: order.deliveryPersonId ?? null,
				serviceDate: order.serviceDate,
				status: (order.status as any) ?? undefined,
				acceptedAt: order.acceptedAt ?? null,
				pickedUpAt: order.pickedUpAt ?? null,
				deliveredAt: order.deliveredAt ?? null,
				canceledAt: order.canceledAt ?? null,
			},
		});

		return mapOrder(updated);
	}

	async findById(id: number): Promise<Order | null> {
		const found = await prisma.order.findUnique({
			where: { id },
		});

		if (!found) return null;

		return mapOrder(found);
	}

	async find(): Promise<Order[]> {
		const found = await prisma.order.findMany();

		return found.map((o) => mapOrder(o));
	}
}
