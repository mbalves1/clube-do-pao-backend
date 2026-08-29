import { z } from 'zod';

export const createItemSchema = z.object({
	name: z.string().min(1),
	description: z.string().min(1).nullable().optional(),
	priceCents: z.number().int().positive(),
	available: z.boolean().optional(),
});

export const updateItemSchema = z.object({
	name: z.string().min(1).optional(),
	description: z.string().min(1).nullable().optional(),
	priceCents: z.number().int().positive().optional(),
	available: z.boolean().optional(),
});
