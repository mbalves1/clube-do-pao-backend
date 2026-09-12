import { FulfillmentType, Order, OrderStatus } from '../entities/orders';

export type OrderStatusPatch = Partial<
	Pick<
		Order,
		| 'preparingAt'
		| 'readyAt'
		| 'acceptedAt'
		| 'pickedUpAt'
		| 'deliveredAt'
		| 'canceledAt'
		| 'deliveryPersonId'
	>
>;

export type GenerateOrderInput = {
	subscriptionId: number;
	bakeryId: string;
	serviceDate: Date;
	fulfillmentType: FulfillmentType;
	items: {
		itemId: string;
		nameSnapshot: string;
		priceCentsSnapshot: number;
		quantity: number;
	}[];
};

export type BakeryOrderFilters = {
	status?: OrderStatus;
	serviceDateFrom?: Date;
	serviceDateTo?: Date;
};

export interface OrdersRepository {
	createFromSubscription(input: GenerateOrderInput): Promise<Order>;
	existsForSubscriptionAndDate(
		subscriptionId: number,
		serviceDate: Date,
	): Promise<boolean>;
	findByIdWithItems(id: number): Promise<Order | null>;
	listByBakery(bakeryId: string, filters: BakeryOrderFilters): Promise<Order[]>;
	findByDateRange(from: Date, to: Date): Promise<Order[]>; // GET /orders (admin)
	findAvailableForDelivery(from: Date, to: Date): Promise<Order[]>; // status READY, DELIVERY, unclaimed
	updateStatus(
		id: number,
		status: OrderStatus,
		patch: OrderStatusPatch,
	): Promise<Order>;
	// Returns false (not throwing) when the order isn't READY/unclaimed — lost-race case per ADR-004.
	claim(id: number, deliveryPersonId: string): Promise<boolean>;
	// Returns false (not throwing) when the caller doesn't own the claim or the order isn't ACCEPTED.
	release(id: number, deliveryPersonId: string): Promise<boolean>;
}
