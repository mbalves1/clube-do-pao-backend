import { Request, Response } from 'express';
import { AppError } from '../../core/errors/AppError';
import { CreateItemUseCase } from '../../core/usecases/item/create-item';
import { DeleteItemUseCase } from '../../core/usecases/item/delete-item';
import { ListItemsUseCase } from '../../core/usecases/item/list-items';
import { UpdateItemUseCase } from '../../core/usecases/item/update-item';

export class ItemController {
	constructor(
		private createItemUseCase: CreateItemUseCase,
		private listItemsUseCase: ListItemsUseCase,
		private updateItemUseCase: UpdateItemUseCase,
		private deleteItemUseCase: DeleteItemUseCase,
	) {}

	async list(req: Request, res: Response): Promise<Response> {
		try {
			const items = await this.listItemsUseCase.execute(req.user.id);
			return res.status(200).json(items);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async create(req: Request, res: Response): Promise<Response> {
		try {
			const item = await this.createItemUseCase.execute(
				req.user.id,
				req.body,
			);
			return res.status(201).json(item);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async update(req: Request, res: Response): Promise<Response> {
		try {
			const item = await this.updateItemUseCase.execute(
				req.user.id,
				String(req.params.id),
				req.body,
			);
			return res.status(200).json(item);
		} catch (error) {
			return this.handleError(error, res);
		}
	}

	async delete(req: Request, res: Response): Promise<Response> {
		try {
			await this.deleteItemUseCase.execute(req.user.id, String(req.params.id));
			return res.status(204).send();
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
