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
