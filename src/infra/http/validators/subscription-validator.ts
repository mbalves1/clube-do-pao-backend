import { z } from 'zod';

export const createSubscriptionSchema = z.object({
	userId: z.string().min(1, 'Id do usuário obrigatório'),
	bakeryId: z.string().min(1, 'Id da padaria obrigatório'),
	subscribe: z.object({
		serviceStartAt: z.string().min(1, 'Data de início obrigatório'),
		serviceEndAt: z.string().min(1, 'Data de termino obrigatório'),
		notes: z.string().min(1, 'Descrição do pedido obrigatório'),
		frequency: z.enum(['daily', 'weekly', 'monthly']),
		daysWeek: z.array(z.string().min(1)).optional(),
		deliveryStartAt: z
			.string()
			.min(1, 'Range de horário do pedido obrigatório'),
		deliveryEndAt: z.string().min(1, 'Range de horário do pedido obrigatório'),
	}),
});
