import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../core/usecases/create-user';
import { GetUserUseCase } from '../../core/usecases/list-user';
import { UpdateUserUseCase } from '../../core/usecases/update-user';

export class UserController {
	constructor(
		private createUserUseCase: CreateUserUseCase,
		private getUserUseCase: GetUserUseCase,
		private updateUserUseCase: UpdateUserUseCase,
	) {}

	async list(req: Request, res: Response): Promise<Response> {
		try {
			const user = await this.getUserUseCase.execute(req.body);
			return res.status(201).json(user);
		} catch (error) {
			return res.status(400).json({
				message:
					error instanceof Error ? error.message : 'Erro ao criar usuário',
			});
		}
	}

	async create(req: Request, res: Response): Promise<Response> {
		try {
			const user = await this.createUserUseCase.execute(req.body);
			return res.status(201).json(user);
		} catch (error) {
			return res.status(400).json({
				message:
					error instanceof Error ? error.message : 'Erro ao criar usuário',
			});
		}
	}

	async update(req: Request, res: Response): Promise<Response> {
		try {
			const user = await this.updateUserUseCase.execute({
				id: req.params.id,
				...req.body,
			});

			return res.status(200).json(user);
		} catch (error) {
			return res.status(400).json({
				message:
					error instanceof Error ? error.message : 'Erro ao atualizar usuário',
			});
		}
	}
}
