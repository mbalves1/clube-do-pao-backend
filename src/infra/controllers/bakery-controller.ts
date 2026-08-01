import { Request, Response } from 'express';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { GetBakeryUseCase } from '../../core/usecases/bakery/list-bakery';

export class BakeryController {
	constructor(private getBakeryUseCase: GetBakeryUseCase) {}

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
}
