import { AppError } from './AppError';

export class UnprocessableEntityError extends AppError {
	constructor(message = 'Entidade não processável') {
		super(message, 422);
	}
}
