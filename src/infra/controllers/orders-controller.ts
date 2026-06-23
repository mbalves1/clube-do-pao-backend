import { Request, Response } from 'express';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';
import { UpdateOrdersUseCase } from '../../core/usecases/orders/update-orders';
import { AppError } from '../../core/errors/AppError';
import { OrderStatus } from '../../core/entities/orders';
import { sseService } from '../sse/sse-service';

type UpdateOrderParams = {
	orderId: string;
	deliveryId: string;
};

type UpdateOrderBody = {
	status: OrderStatus;
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
		req: Request,
		res: Response,
	): Promise<Response> {
		try {
			const { orderId, deliveryId } = req.params as UpdateOrderParams;
			const { status } = req.body as UpdateOrderBody;
			const orders = await this.updateOrdersUseCase.execute(
				Number(orderId),
				deliveryId,
				status,
			);
			sseService.emit('order-status-updated', { orderId, deliveryId, status });
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
