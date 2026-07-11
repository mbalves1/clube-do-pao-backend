import { DeliveryUser } from '../entities/delivery';

export interface DeliveryUserRepository {
	create(user: any): Promise<any>;
	findBySupabaseUserId(supabaseUserId: string): Promise<DeliveryUser | null>;
}
