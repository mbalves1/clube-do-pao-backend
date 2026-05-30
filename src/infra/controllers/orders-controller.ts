import { Request, Response } from 'express';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';
import { UpdateOrdersUseCase } from '../../core/usecases/orders/update-orders';
import { AppError } from '../../core/errors/AppError';

type UpdateOrderParams = {
	orderId: string;
	deliveryId: string;
};

export class OrdersController {
	constructor(
		private listOrdersUseCase: ListOrdersUseCase,
		private updateOrdersUseCase: UpdateOrdersUseCase,
	) {}

	async list(req: Request, res: Response): Promise<Response> {
		try {
			const orders = await this.listOrdersUseCase.execute();
			return res.status(200).json(orders);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao listar padarias'));
		}
	}

	async updateOrder(
		req: Request<UpdateOrderParams>,
		res: Response,
	): Promise<Response> {
		try {
			const orderId = Number(req.params.orderId);
			const deliveryId = req.params.deliveryId;
			const orders = await this.updateOrdersUseCase.execute(
				orderId,
				deliveryId,
			);
			return res.status(200).json(orders);
		} catch (error) {
			if (error instanceof AppError) {
				return res.status(error.statusCode).json({
					error: error.message,
				});
			}
			console.error(error);
			return res.status(500).json({
				error: 'Erro interno do servidor',
			});
		}
	}
}
