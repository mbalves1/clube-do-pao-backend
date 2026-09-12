import { AppError } from './AppError';

export class InvalidOrderStatusTransitionError extends AppError {
	constructor(message = 'Transição de status inválida') {
		super(message, 422);
	}
}
