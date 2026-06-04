import { DeliveryUser } from '../entities/delivery';

export interface DeliveryUserRepository {
	create(user: any): Promise<any>;
}
