import { Request, Response } from 'express';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';

export class OrdersController {
	constructor(private listOrdersUseCase: ListOrdersUseCase) {}

	async list(req: Request, res: Response): Promise<Response> {
		try {
			const orders = await this.listOrdersUseCase.execute();
			return res.status(201).json(orders);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao listar padarias'));
		}
	}
}
