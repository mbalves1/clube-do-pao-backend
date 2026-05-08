import { ZodError } from 'zod';

export function formatBadRequest(error: unknown, fallbackMessage: string) {
	if (error instanceof ZodError) {
		return {
			message: 'Dados inválidos',
			errors: error.issues.map((issue) => ({
				field: issue.path.join('.'),
				message: issue.message,
			})),
		};
	}

	return {
		message: error instanceof Error ? error.message : fallbackMessage,
	};
}
