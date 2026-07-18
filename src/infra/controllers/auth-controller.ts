import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { LoginUseCase } from '../../core/usecases/auth/login';
import { RefreshSessionUseCase } from '../../core/usecases/auth/refresh-session';
import { UnprocessableEntityError } from '../../core/errors/UnprocessableEntityError';
import { loginSchema, refreshSchema } from '../http/validators/auth-validator';
import { formatBadRequest } from '../http/validators/format-validation-error';

export class AuthController {
	constructor(
		private loginUseCase: LoginUseCase,
		private refreshSessionUseCase: RefreshSessionUseCase,
	) {}

	async login(req: Request, res: Response): Promise<Response> {
		try {
			const data = loginSchema.parse(req.body);
			const result = await this.loginUseCase.execute(data);
			return res.status(200).json(result);
		} catch (error) {
			if (error instanceof ZodError) {
				return res
					.status(400)
					.json(formatBadRequest(error, 'Erro ao validar login'));
			}
			if (error instanceof UnprocessableEntityError) {
				return res.status(401).json({ message: 'Email ou senha inválidos' });
			}
			console.error(error);
			return res.status(500).json({ message: 'Erro interno do servidor' });
		}
	}

	async refresh(req: Request, res: Response): Promise<Response> {
		try {
			const data = refreshSchema.parse(req.body);
			const result = await this.refreshSessionUseCase.execute(data);
			return res.status(200).json(result);
		} catch (error) {
			if (error instanceof ZodError) {
				return res
					.status(400)
					.json(formatBadRequest(error, 'Erro ao validar refresh'));
			}
			if (error instanceof UnprocessableEntityError) {
				return res
					.status(401)
					.json({ message: 'Sessão expirada, faça login novamente' });
			}
			console.error(error);
			return res.status(500).json({ message: 'Erro interno do servidor' });
		}
	}
}
