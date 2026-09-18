import { Order as PrismaOrder, OrderItem as PrismaOrderItem } from '@prisma/client';
import { Order } from '../../core/entities/orders';

type PrismaOrderWithItems = PrismaOrder & { items: PrismaOrderItem[] };

export function toOrder(prismaOrder: PrismaOrderWithItems): Order {
	return {
		id: prismaOrder.id,
		subscriptionId: prismaOrder.subscriptionId,
		bakeryId: prismaOrder.bakeryId,
		deliveryPersonId: prismaOrder.deliveryPersonId ?? null,
		serviceDate: prismaOrder.serviceDate,
		fulfillmentType: prismaOrder.fulfillmentType,
		status: prismaOrder.status,
		items: prismaOrder.items.map((item) => ({
			id: item.id,
			orderId: item.orderId,
			itemId: item.itemId,
			nameSnapshot: item.nameSnapshot,
			priceCentsSnapshot: item.priceCentsSnapshot,
			quantity: item.quantity,
		})),
		preparingAt: prismaOrder.preparingAt ?? null,
		readyAt: prismaOrder.readyAt ?? null,
		acceptedAt: prismaOrder.acceptedAt ?? null,
		pickedUpAt: prismaOrder.pickedUpAt ?? null,
		deliveredAt: prismaOrder.deliveredAt ?? null,
		canceledAt: prismaOrder.canceledAt ?? null,
		createdAt: prismaOrder.createdAt,
		updatedAt: prismaOrder.updatedAt,
	};
}
