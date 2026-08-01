import { z } from 'zod';

export const updateBakerySchema = z.object({
	name: z.string().min(1).optional(),
	cnpj: z.string().min(1).optional(),
	email: z.string().email().optional(),
	phone: z.string().optional(),
	whatsapp: z.string().optional(),
	serviceStartAt: z.string().optional(),
	serviceEndAt: z.string().optional(),
	zipCode: z.string().optional(),
	street: z.string().optional(),
	number: z.string().optional(),
	district: z.string().optional(),
	city: z.string().optional(),
	state: z.string().optional(),
});
