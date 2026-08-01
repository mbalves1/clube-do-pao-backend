import { z } from 'zod';

const baseFields = {
	name: z.string().min(1, 'Nome é obrigatório'),
	email: z.string().email('Email inválido'),
	// Minimum length is a placeholder default; product has not yet defined a password policy (see PRD "Open Questions").
	password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
};

const createCustomerSchema = z.object({
	...baseFields,
	role: z.literal('customer'),
});

const createCompanySchema = z.object({
	...baseFields,
	role: z.literal('company'),
	businessName: z.string().min(1, 'Nome da padaria é obrigatório'),
	cnpj: z.string().min(1, 'CNPJ é obrigatório'),
	phone: z.string().min(1, 'Telefone é obrigatório'),
	whatsapp: z.string().min(1, 'WhatsApp é obrigatório'),
	serviceStartAt: z.string().min(1, 'Horário de início é obrigatório'),
	serviceEndAt: z.string().min(1, 'Horário de fim é obrigatório'),
});

const createDeliverySchema = z.object({
	...baseFields,
	role: z.literal('delivery'),
	document: z.string().min(1, 'CPF é obrigatório'),
	phone: z.string().min(1, 'Telefone é obrigatório'),
	modal: z.enum(['BIKE', 'MOTORCYCLE', 'WALKING']),
});

export const createUserSchema = z.discriminatedUnion('role', [
	createCustomerSchema,
	createCompanySchema,
	createDeliverySchema,
]);

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
