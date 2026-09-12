import { FulfillmentType } from '../entities/orders';
import { SubscriptionItem } from '../entities/subscription-item';

export type SubscriptionTemplateForDate = {
	id: number;
	bakeryId: string;
	userId: string;
	serviceDate: Date; // the target date, echoed back for convenience
	fulfillmentType: FulfillmentType;
	items: {
		itemId: string;
		nameSnapshot: string;
		priceCentsSnapshot: number;
		quantity: number;
	}[];
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
	fulfillmentType?: FulfillmentType;
}

export interface SubscribeRepository {
	create(data: SubscribeCreateData): Promise<any>;
	getList(userId: string): Promise<any>;
	getSubscribeById(orderId: number): Promise<any>;
	getAll(page: number, limit: number, serviceDate?: string): Promise<any>;
	// Templates (`active = true`) whose schedule matches `date` — the generation
	// use case's single read (ADR-001). `items` is already snapshot-shaped,
	// read from the live `Item` at query time (ADR-002).
	listActiveTemplatesForDate(date: Date): Promise<SubscriptionTemplateForDate[]>;
	getItems(subscriptionId: number): Promise<SubscriptionItem[]>;
	setItems(
		subscriptionId: number,
		items: { itemId: string; quantity: number }[],
	): Promise<void>;
}
