import { User } from '../../core/entities/user';
import { UserRepository } from '../../core/ports/user-repository';
import { prisma } from '../database/prisma-client';

export class PrismaUserRepository implements UserRepository {
	async create(user: Omit<User, 'id'>): Promise<User> {
		const created = await prisma.user.create({
			data: {
				name: user.name,
				email: user.email,
			},
		});

		return {
			id: created.id,
			name: created.name,
			email: created.email,
			createdAt: created.createdAt,
		};
	}

	async findByEmail(email: string): Promise<User | null> {
		const found = await prisma.user.findUnique({
			where: { email },
		});

		if (!found) {
			return null;
		}

		return {
			id: found.id,
			name: found.name,
			email: found.email,
			createdAt: found.createdAt,
		};
	}

	async find(): Promise<any | null> {
		const found = await prisma.user.findMany();

		if (!found) {
			return null;
		}

		return found;
	}
}
