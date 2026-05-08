import { User } from '../entities/user';

export type UpdateUserData = Partial<
	Omit<User, 'id' | 'createdAt' | 'favoriteBakeries' | 'appointments'>
> & {
	id: string;
};

export interface UserRepository {
	create(user: Omit<User, 'id'>): Promise<User>;
	update(user: UpdateUserData): Promise<User>;
	findByEmail(email: string): Promise<User | null>;
	find(): Promise<User[]>;
}
