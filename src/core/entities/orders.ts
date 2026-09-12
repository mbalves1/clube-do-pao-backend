import { OrderItem } from './order-item';

export type OrderStatus =
	| 'PENDING'
	| 'PREPARING'
	| 'READY'
	| 'ACCEPTED'
	| 'PICKED_UP'
	| 'DELIVERED'
	| 'CANCELED';

export type FulfillmentType = 'PICKUP' | 'DELIVERY';

export type Order = {
	id: number;
	subscriptionId: number;
	bakeryId: string;
	deliveryPersonId?: string | null;
	serviceDate: Date;
	fulfillmentType: FulfillmentType;
	status: OrderStatus;
	items: OrderItem[];
	preparingAt?: Date | null;
	readyAt?: Date | null;
	acceptedAt?: Date | null;
	pickedUpAt?: Date | null;
	deliveredAt?: Date | null;
	canceledAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type Orders = Order;
