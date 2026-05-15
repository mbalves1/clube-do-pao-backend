import { z } from 'zod';

export const createBakerySchema = z.object({
	name: z.string().min(1, 'Nome é obrigatório'),
	cnpj: z.string().min(1, 'CNPJ é obrigatório'),
	email: z.string().email('Email inválido'),
	phone: z.string().min(1, 'Telefone é obrigatório'),
	whatsapp: z.string().min(1, 'WhatsApp é obrigatório'),
	serviceStartAt: z.string().min(1, 'Horário de início é obrigatório'),
	serviceEndAt: z.string().min(1, 'Horário de fim é obrigatório'),
});

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
