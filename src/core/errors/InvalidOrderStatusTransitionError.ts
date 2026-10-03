import { ConflictError } from './ConflictError';

export class InvalidOrderStatusTransitionError extends ConflictError {
	constructor(message = 'Transição de status inválida') {
		super(message);
	}
}
