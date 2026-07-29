import { OrderStatus } from '../entities/orders';

export type AvailableOrder = {
	id: number;
	bakeryId: string;
	serviceDate: Date;
	serviceStartAt: string;
	serviceEndAt: string;
	deliveryStartAt: string;
	deliveryEndAt: string;
	status: OrderStatus;
};

export interface SubscribeCreateData {
	userId: string;
	bakeryId: string;
	serviceDate: Date;
	serviceStartAt: string;
	serviceEndAt: string;
	frequency: 'daily' | 'weekly' | 'monthly';
	daysWeek?: string[];
	deliveryStartAt: string;
	deliveryEndAt: string;
	status?: 'ACTIVE' | 'PAUSED' | 'CANCELED' | 'PENDING';
	notes: string;
}

export interface SubscribeRepository {
	create(data: SubscribeCreateData): Promise<any>;
	getList(userId: string): Promise<any>;
	getOrderByDay(startOfDay: Date, endOfDay: Date): Promise<any>;
	updateOrder(
		orderId: number,
		deliveryId: string,
		status: OrderStatus,
	): Promise<any>;
	getSubscribeById(orderId: number): Promise<any>;
	getAll(page: number, limit: number, serviceDate?: string): Promise<any>;
	findAvailable(startDate: Date, endDate: Date): Promise<AvailableOrder[]>;
	// Returns false (not throwing) when the order is already claimed — lost-race case per ADR-004.
	claim(id: number, deliveryPersonId: string): Promise<boolean>;
	// Returns false (not throwing) when the caller doesn't own the claim or the order isn't ACCEPTED.
	release(id: number, deliveryPersonId: string): Promise<boolean>;
}
