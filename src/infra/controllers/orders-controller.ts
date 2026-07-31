import { Request, Response } from 'express';
import { formatBadRequest } from '../http/validators/format-validation-error';
import { ListOrdersUseCase } from '../../core/usecases/orders/list-orders';
import { UpdateOrdersUseCase } from '../../core/usecases/orders/update-orders';
import { ListAvailableOrdersUseCase } from '../../core/usecases/orders/list-available-orders';
import { AcceptOrderUseCase } from '../../core/usecases/orders/accept-order';
import { ReleaseOrderUseCase } from '../../core/usecases/orders/release-order';
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
		private listAvailableOrdersUseCase: ListAvailableOrdersUseCase,
		private acceptOrderUseCase: AcceptOrderUseCase,
		private releaseOrderUseCase: ReleaseOrderUseCase,
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

	async listAvailable(req: Request, res: Response): Promise<Response> {
		try {
			const orders = await this.listAvailableOrdersUseCase.execute();
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

	async acceptOrder(req: Request, res: Response): Promise<Response> {
		try {
			await this.acceptOrderUseCase.execute(
				Number(req.params.id),
				req.user.id,
			);
			return res.status(200).json({ message: 'Pedido aceito com sucesso' });
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

	async releaseOrder(req: Request, res: Response): Promise<Response> {
		try {
			const released = await this.releaseOrderUseCase.execute(
				Number(req.params.id),
				req.user.id,
			);
			sseService.emit('order-available', released);
			return res.status(200).json({ message: 'Pedido liberado com sucesso' });
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
				req.user.id,
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
