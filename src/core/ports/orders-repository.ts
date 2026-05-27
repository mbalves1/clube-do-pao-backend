import { Order } from '../entities/orders';

export type CreateOrderData = Omit<
	Order,
	'id' | 'status' | 'createdAt' | 'updatedAt'
> & {
	status?: Order['status'];
};

export type UpdateOrderData = Partial<
	Omit<Order, 'id' | 'createdAt' | 'updatedAt'>
> & {
	id: number;
};

export interface OrdersRepository {
	create(order: CreateOrderData, deliveryId: string): Promise<Order>;
	update(order: UpdateOrderData): Promise<Order>;
	findById(id: number): Promise<Order | null>;
	find(): Promise<Order[]>;
}
