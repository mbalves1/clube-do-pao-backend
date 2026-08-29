import { Request, Response } from 'express';
import { AppError } from '../../core/errors/AppError';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { GetBakeryUseCase } from '../../core/usecases/bakery/list-bakery';
import { CreateBakeryUseCase } from '../../core/usecases/bakery/create-bakery';

export class BakeryController {
	constructor(
		private getBakeryUseCase: GetBakeryUseCase,
		private createBakeryUseCase: CreateBakeryUseCase,
	) {}

	async list(req: Request, res: Response): Promise<Response> {
		try {
			const user = await this.getBakeryUseCase.execute();
			return res.status(201).json(user);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao listar padarias'));
		}
	}

	async create(req: Request, res: Response): Promise<Response> {
		try {
			const bakery = await this.createBakeryUseCase.execute(
				req.user.id,
				req.body,
			);
			return res.status(201).json(bakery);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	private handleError(error: unknown, res: Response): Response {
		if (error instanceof AppError) {
			return res.status(error.statusCode).json({ error: error.message });
		}
		console.error(error);
		return res.status(500).json({ error: 'Erro interno do servidor' });
	}
}
