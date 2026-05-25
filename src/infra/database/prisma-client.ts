import { PrismaClient } from '@prisma/client';

let prismaClient: PrismaClient | null = null;

function getPrismaClient() {
	if (!prismaClient) {
		prismaClient = new PrismaClient({
			datasourceUrl: process.env.DATABASE_URL,
		});
	}

	return prismaClient;
}

export const prisma = new Proxy({} as PrismaClient, {
	get(_target, prop) {
		const value = Reflect.get(getPrismaClient(), prop);

		if (typeof value === 'function') {
			return value.bind(getPrismaClient());
		}

		return value;
	},
});
