import { Request, Response } from 'express';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { CreateSubscribeUseCase } from '../../core/usecases/subscribe/create-subscribe';
import { ListSubscribeUseCase } from '../../core/usecases/subscribe/list-subscribe';
import { createSubscriptionSchema } from '../http/validators/subscription-validator';

export class SubscribeController {
	constructor(
		private createSubscribeUseCase: CreateSubscribeUseCase,
		private getSubscribeUseCase: ListSubscribeUseCase,
	) {}

	async create(req: Request, res: Response): Promise<Response> {
		try {
			const payload = createSubscriptionSchema.parse(req.body);

			const user = await this.createSubscribeUseCase.execute(
				payload.userId,
				payload.bakeryId,
				payload.subscribe,
			);
			return res.status(201).json(user);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao regsitrar pedidos'));
		}
	}

	async list(req: Request, res: Response): Promise<Response> {
		try {
			const id = req.params.id as string;
			const user = await this.getSubscribeUseCase.execute(id);
			return res.status(200).json(user);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao listar padarias'));
		}
	}
}
