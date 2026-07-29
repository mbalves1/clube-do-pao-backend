import { z } from 'zod';

const deliveryModalSchema = z.enum(['BIKE', 'MOTORCYCLE', 'WALKING']);

export const createDeliverySchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório'),
	document: z.string().min(1, 'CPF é obrigatório'),
	email: z.string().email('Email inválido'),
	phone: z.string().min(1, 'Telefone é obrigatório'),
	modal: deliveryModalSchema,
	// Minimum length is a placeholder default; product has not yet defined a password policy (see PRD "Open Questions").
	password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
});

export const updateDeliverySchema = z.object({
	name: z.string().min(1).optional(),
	document: z.string().min(1).optional(),
	phone: z.string().optional(),
	modal: deliveryModalSchema.optional(),
});

export type CreateDeliveryDTO = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryDTO = z.infer<typeof updateDeliverySchema>;
