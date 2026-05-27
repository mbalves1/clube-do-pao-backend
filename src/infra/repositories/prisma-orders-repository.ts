import { OrderStatus } from '@prisma/client';
import { Order } from '../../core/entities/orders';
import {
	CreateOrderData,
	OrdersRepository,
	UpdateOrderData,
} from '../../core/ports/orders-repository';
import { prisma } from '../database/prisma-client';

function mapOrder(order: any, deliveryId: string) {
	return {
		subscriptionId: order.subscriptionId,
		deliveryPersonId: deliveryId,
		serviceDate: order.serviceDate,
		status: OrderStatus.PENDING,
		acceptedAt: null,
		pickedUpAt: null,
		deliveredAt: null,
		canceledAt: null,
	};
}

export class PrismaOrdersRepository implements OrdersRepository {
	async create(order: any, deliveryId: string): Promise<any> {
		console.log('order', order);

		const created = await prisma.order.create({
			data: {
				subscriptionId: order.id,
				deliveryPersonId: deliveryId,
				serviceDate: order.serviceDate,
				status: 'PENDING',
				acceptedAt: null,
				pickedUpAt: null,
				deliveredAt: null,
				canceledAt: null,
			},
		});

		return created;
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
