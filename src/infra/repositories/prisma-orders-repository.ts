import { Order } from '../../core/entities/orders';
import {
	CreateOrderData,
	OrdersRepository,
	UpdateOrderData,
} from '../../core/ports/orders-repository';
import { prisma } from '../database/prisma-client';

function mapOrder(order: Order): Order {
	return {
		id: order.id,
		subscriptionId: order.subscriptionId,
		deliveryPersonId: order.deliveryPersonId,
		serviceDate: order.serviceDate,
		status: order.status,
		acceptedAt: order.acceptedAt,
		pickedUpAt: order.pickedUpAt,
		deliveredAt: order.deliveredAt,
		canceledAt: order.canceledAt,
		createdAt: order.createdAt,
		updatedAt: order.updatedAt,
	};
}

export class PrismaOrdersRepository implements OrdersRepository {
	async create(order: CreateOrderData): Promise<Order> {
		const created = await prisma.order.create({
			data: {
				subscriptionId: order.subscriptionId,
				deliveryPersonId: order.deliveryPersonId,
				serviceDate: order.serviceDate,
				status: order.status,
				acceptedAt: order.acceptedAt,
				pickedUpAt: order.pickedUpAt,
				deliveredAt: order.deliveredAt,
				canceledAt: order.canceledAt,
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
				deliveryPersonId: order.deliveryPersonId,
				serviceDate: order.serviceDate,
				status: order.status,
				acceptedAt: order.acceptedAt,
				pickedUpAt: order.pickedUpAt,
				deliveredAt: order.deliveredAt,
				canceledAt: order.canceledAt,
			},
		});

		return mapOrder(updated);
	}

	async findById(id: number): Promise<Order | null> {
		const found = await prisma.order.findUnique({
			where: { id },
		});

		if (!found) {
			return null;
		}

		return mapOrder(found);
	}

	async find(): Promise<Order[]> {
		const found = await prisma.order.findMany();

		return found.map(mapOrder);
	}
}
