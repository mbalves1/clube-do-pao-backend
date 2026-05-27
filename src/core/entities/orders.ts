export type OrderStatus =
	| 'PENDING'
	| 'ACCEPTED'
	| 'PICKED_UP'
	| 'DELIVERED'
	| 'ACTIVE'
	| 'CANCELED';

export type Order = {
	id: number;
	subscriptionId: number;
	deliveryPersonId?: string | null;
	serviceDate: Date;
	status?: OrderStatus | null;
	acceptedAt?: Date | null;
	pickedUpAt?: Date | null;
	deliveredAt?: Date | null;
	canceledAt?: Date | null;
	createdAt: Date;
	updatedAt: Date;
};

export type Orders = Order;
