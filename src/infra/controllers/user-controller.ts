import { Request, Response } from 'express';
import { CreateUserUseCase } from '../../core/usecases/create-user';

export class UserController {
	constructor(private createUserUseCase: CreateUserUseCase) {}

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
}
