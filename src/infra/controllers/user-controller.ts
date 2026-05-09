import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../core/usecases/user/create-user';
import { GetUserUseCase } from '../../core/usecases/user/list-user';
import { UpdateUserUseCase } from '../../core/usecases/user/update-user';
import {
	createUserSchema,
	updateUserSchema,
} from '../http/validators/user-validator';
import { formatBadRequest } from '../http/validators/format-validation-error';

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
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao listar usuários'));
		}
	}

	async create(req: Request, res: Response): Promise<Response> {
		try {
			const data = createUserSchema.parse(req.body);
			const user = await this.createUserUseCase.execute(data);
			return res.status(201).json(user);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao criar usuário'));
		}
	}

	async update(req: Request, res: Response): Promise<Response> {
		try {
			const data = updateUserSchema.parse(req.body);
			const id = String(req.params.id);
			const user = await this.updateUserUseCase.execute({
				id,
				...data,
			});

			return res.status(200).json(user);
		} catch (error) {
			return res
				.status(400)
				.json(formatBadRequest(error, 'Erro ao atualizar usuário'));
		}
	}
}
