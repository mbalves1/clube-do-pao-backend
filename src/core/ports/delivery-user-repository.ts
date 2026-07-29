import { DeliveryUser } from '../entities/delivery';

export type CreateDeliveryUserData = {
	name: string;
	document: string;
	email: string;
	phone: string;
	modal: 'BIKE' | 'MOTORCYCLE' | 'WALKING';
	supabaseUserId: string;
};

export interface DeliveryUserRepository {
	create(user: CreateDeliveryUserData): Promise<DeliveryUser>;
	findBySupabaseUserId(supabaseUserId: string): Promise<DeliveryUser | null>;
}
