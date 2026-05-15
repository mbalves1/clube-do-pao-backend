import { Request, Response } from 'express';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { GetBakeryUseCase } from '../../core/usecases/bakery/list-bakery';
import { CreateBakeryUseCase } from '../../core/usecases/bakery/create-bakery';
import { createBakerySchema } from '../http/validators/bakery-validator';

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
			const data = createBakerySchema.parse(req.body);
			const user = await this.createBakeryUseCase.execute(data);
			return res.status(201).json(user);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao criar padaria'));
		}
	}
}
