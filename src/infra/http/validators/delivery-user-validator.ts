import { z } from 'zod';

const deliveryModalSchema = z.enum(['BIKE', 'MOTORCYCLE', 'WALKING']);

export const createDeliverySchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório'),
	document: z.string().min(1, 'CPF é obrigatório'),
	email: z.string().email('Email inválido'),
	phone: z.string().min(1, 'Telefone é obrigatório'),
	modal: deliveryModalSchema,
});

export const updateDeliverySchema = z.object({
	name: z.string().min(1).optional(),
	document: z.string().min(1).optional(),
	phone: z.string().optional(),
	modal: deliveryModalSchema.optional(),
});

export type CreateDeliveryDTO = z.infer<typeof createDeliverySchema>;
export type UpdateDeliveryDTO = z.infer<typeof updateDeliverySchema>;
