// src/infra/http/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
	definition: {
		openapi: '3.0.0',
		info: {
			title: 'Clube do Pão API',
			version: '1.0.0',
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
			schemas: {
				User: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							format: 'uuid',
							example: '9f8fbb63-51b5-4a86-9f45-b97088f0526c',
						},
						name: {
							type: 'string',
							example: 'Murilo',
						},
						email: {
							type: 'string',
							format: 'email',
							example: 'murilo@email.com',
						},
						phone: {
							type: 'string',
							nullable: true,
							example: '11999999999',
						},
						zipCode: {
							type: 'string',
							nullable: true,
							example: '01001000',
						},
						street: {
							type: 'string',
							nullable: true,
							example: 'Rua das Flores',
						},
						number: {
							type: 'string',
							nullable: true,
							example: '123',
						},
						district: {
							type: 'string',
							nullable: true,
							example: 'Centro',
						},
						city: {
							type: 'string',
							nullable: true,
							example: 'São Paulo',
						},
						state: {
							type: 'string',
							nullable: true,
							example: 'SP',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
							example: '2026-05-08T12:00:00.000Z',
						},
					},
				},
				Bakery: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							format: 'uuid',
							example: 'e0758e45-fd77-4dfc-86ad-dab31b7932ed',
						},
						name: {
							type: 'string',
							example: 'Padaria Central',
						},
						cnpj: {
							type: 'string',
							example: '12345678000199',
						},
						email: {
							type: 'string',
							format: 'email',
							example: 'padaria@email.com',
						},
						phone: {
							type: 'string',
							example: '11999999999',
						},
						whatsapp: {
							type: 'string',
							example: '11999999999',
						},
						serviceStartAt: {
							type: 'string',
							example: '08:00',
						},
						serviceEndAt: {
							type: 'string',
							example: '18:00',
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
							example: '2026-05-08T12:00:00.000Z',
						},
					},
				},
				Item: {
					type: 'object',
					properties: {
						id: {
							type: 'string',
							format: 'uuid',
							example: 'b3e2f8a0-1c2d-4e3f-9a5b-6c7d8e9f0a1b',
						},
						bakeryId: {
							type: 'string',
							format: 'uuid',
							example: 'e0758e45-fd77-4dfc-86ad-dab31b7932ed',
						},
						name: {
							type: 'string',
							example: 'Pão francês',
						},
						description: {
							type: 'string',
							nullable: true,
							example: 'Pão francês fresquinho, saído do forno',
						},
						priceCents: {
							type: 'integer',
							example: 150,
							description: 'Preço em centavos (150 = R$ 1,50)',
						},
						available: {
							type: 'boolean',
							example: true,
						},
						createdAt: {
							type: 'string',
							format: 'date-time',
							example: '2026-05-08T12:00:00.000Z',
						},
						updatedAt: {
							type: 'string',
							format: 'date-time',
							example: '2026-05-08T12:00:00.000Z',
						},
					},
				},
				CreateItem: {
					type: 'object',
					required: ['name', 'priceCents'],
					properties: {
						name: {
							type: 'string',
							example: 'Pão francês',
						},
						description: {
							type: 'string',
							example: 'Pão francês fresquinho, saído do forno',
						},
						priceCents: {
							type: 'integer',
							example: 150,
						},
						available: {
							type: 'boolean',
							example: true,
						},
					},
				},
				UpdateItem: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							example: 'Pão francês',
						},
						description: {
							type: 'string',
							example: 'Pão francês fresquinho, saído do forno',
						},
						priceCents: {
							type: 'integer',
							example: 150,
						},
						available: {
							type: 'boolean',
							example: false,
						},
					},
				},
				UpdateUser: {
					type: 'object',
					properties: {
						name: {
							type: 'string',
							example: 'Murilo Silva',
						},
						email: {
							type: 'string',
							format: 'email',
							example: 'murilo.silva@email.com',
						},
						phone: {
							type: 'string',
							example: '11999999999',
						},
						zipCode: {
							type: 'string',
							example: '01001000',
						},
						street: {
							type: 'string',
							example: 'Rua das Flores',
						},
						number: {
							type: 'string',
							example: '123',
						},
						district: {
							type: 'string',
							example: 'Centro',
						},
						city: {
							type: 'string',
							example: 'São Paulo',
						},
						state: {
							type: 'string',
							example: 'SP',
						},
					},
				},
			},
		},
	},
	apis: ['src/infra/http/routes/**/*.ts'],
});
