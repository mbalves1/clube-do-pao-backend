import { DeliveryUser } from '../entities/delivery';

export type CreateDeliveryUserData = {
	userId: string;
	document: string;
	phone?: string;
	modal: 'BIKE' | 'MOTORCYCLE' | 'WALKING';
};

export interface DeliveryUserRepository {
	create(user: CreateDeliveryUserData): Promise<DeliveryUser>;
	findByUserId(userId: string): Promise<DeliveryUser | null>;
}
