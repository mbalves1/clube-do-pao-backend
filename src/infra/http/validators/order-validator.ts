import { z } from 'zod';

export const updateOrderSchema = z.object({
	status: z.enum([
		'PENDING',
		'ACCEPTED',
		'PICKED_UP',
		'DELIVERED',
		'CANCELED',
	]),
});
