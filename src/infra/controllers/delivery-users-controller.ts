import { Request, Response } from 'express';
import { CreateDeliveryUserUseCase } from '../../core/usecases/delivery/create-delivery';
import { formatBadRequest } from '../http/validators/format-validation-error';

export class DeliveryUsersController {
	constructor(private createDeliveryUserUseCase: CreateDeliveryUserUseCase) {}

	async create(req: Request, res: Response): Promise<Response> {
		try {
			const data = req.body;
			const user = await this.createDeliveryUserUseCase.execute(data);
			return res.status(201).json(user);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao criar registro'));
		}
	}
}
