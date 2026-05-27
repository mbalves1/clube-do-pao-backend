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
	updateOrder(orderId: number, deliveryId: string): Promise<any>;
	getSubscribeById(orderId: number): Promise<any>;
}
