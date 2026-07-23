import { z } from 'zod';

export const createUserSchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório'),
	email: z.string().email('Email inválido'),
	// Minimum length is a placeholder default; product has not yet defined a password policy (see PRD "Open Questions").
	password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
	role: z.enum(['customer', 'delivery', 'company']).default('customer'),
});

export const updateUserSchema = z.object({
	name: z.string().min(1).optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	zipCode: z.string().optional(),
	street: z.string().optional(),
	number: z.string().optional(),
	district: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
});
