import { Request, Response } from 'express';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { CreateSubscribeUseCase } from '../../core/usecases/subscribe/create-subscribe';
import { ListSubscribeUseCase } from '../../core/usecases/subscribe/list-subscribe';

export class SubscribeController {
	constructor(
		private createSubscribeUseCase: CreateSubscribeUseCase,
		private getSubscribeUseCase: ListSubscribeUseCase,
	) {}

	async create(req: Request, res: Response): Promise<Response> {
		try {
			const userId = req.body.userId;
			const bakeryId = req.body.bakeryId;
			const subscribe = req.body.subscribe;
			const user = await this.createSubscribeUseCase.execute(
				userId,
				bakeryId,
				subscribe,
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
			return res.status(201).json(user);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao listar padarias'));
		}
	}
}
