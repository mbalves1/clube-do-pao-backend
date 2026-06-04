import { PrismaDeliveryUserRepository } from '../../../infra/repositories/prisma-delivery-user-repository';

export class CreateDeliveryUserUseCase {
	constructor(private deliveryRepository: PrismaDeliveryUserRepository) {}

	async execute(data: any): Promise<any> {
		return this.deliveryRepository.create(data);
	}
}
