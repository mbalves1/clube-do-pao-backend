import { z } from 'zod';

// Courier PATCH /orders/:orderId/:deliveryId — narrowed to the statuses a
// courier reaches through this route (claim/release have their own
// dedicated endpoints, see ADR-004).
export const updateOrderSchema = z.object({
	status: z.enum(['PICKED_UP', 'DELIVERED', 'CANCELED']),
});

// POST /orders/generate
export const generateOrdersSchema = z.object({
	date: z
		.string()
		.regex(/^\d{2}-\d{2}-\d{4}$/, 'Data deve estar no formato dd-mm-yyyy')
		.optional(),
});

// PATCH /orders/:id/status — seller-owned transitions (ADR-003).
export const updateOrderStatusBySellerSchema = z.object({
	status: z.enum(['PREPARING', 'READY', 'CANCELED', 'PICKED_UP']),
});

// GET /orders/bakery — parsed against req.query in the controller (task_19),
// not through the body-validation middleware.
export const listBakeryOrdersQuerySchema = z.object({
	status: z
		.enum([
			'PENDING',
			'PREPARING',
			'READY',
			'ACCEPTED',
			'PICKED_UP',
			'DELIVERED',
			'CANCELED',
		])
		.optional(),
	date: z
		.string()
		.regex(/^\d{2}-\d{2}-\d{4}$/, 'Data deve estar no formato dd-mm-yyyy')
		.optional(),
});
