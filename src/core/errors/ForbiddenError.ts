import { AppError } from './AppError';

export class ForbiddenError extends AppError {
	constructor(message = 'Acesso não permitido') {
		super(message, 403);
	}
}
