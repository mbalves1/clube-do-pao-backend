import { User } from '../../core/entities/user';
import {
	UpdateUserData,
	UserRepository,
} from '../../core/ports/user-repository';
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
			phone: created.phone,
			zipCode: created.zipCode,
			street: created.street,
			number: created.number,
			district: created.district,
			city: created.city,
			state: created.state,
			createdAt: created.createdAt,
		};
	}

	async update(user: UpdateUserData): Promise<User> {
		const updated = await prisma.user.update({
			where: {
				id: user.id,
			},
			data: {
				name: user.name,
				email: user.email,
				phone: user.phone,
				zipCode: user.zipCode,
				street: user.street,
				number: user.number,
				district: user.district,
				city: user.city,
				state: user.state,
			},
		});

		return {
			id: updated.id,
			name: updated.name,
			email: updated.email,
			phone: updated.phone,
			zipCode: updated.zipCode,
			street: updated.street,
			number: updated.number,
			district: updated.district,
			city: updated.city,
			state: updated.state,
			createdAt: updated.createdAt,
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
			phone: found.phone,
			zipCode: found.zipCode,
			street: found.street,
			number: found.number,
			district: found.district,
			city: found.city,
			state: found.state,
			createdAt: found.createdAt,
		};
	}

	async find(): Promise<User[]> {
		const found = await prisma.user.findMany();

		return found.map((user) => ({
			id: user.id,
			name: user.name,
			email: user.email,
			phone: user.phone,
			zipCode: user.zipCode,
			street: user.street,
			number: user.number,
			district: user.district,
			city: user.city,
			state: user.state,
			createdAt: user.createdAt,
		}));
	}
}
