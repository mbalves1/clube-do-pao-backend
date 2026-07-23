export type Role = 'customer' | 'delivery' | 'company';

export type AuthSession = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
	supabaseUserId: string;
	role: Role;
};

export interface AuthGateway {
	signInWithPassword(email: string, password: string): Promise<AuthSession>;
	refreshSession(refreshToken: string): Promise<Omit<AuthSession, 'supabaseUserId' | 'role'>>;
	createCredential(email: string, password: string, role: Role): Promise<{ supabaseUserId: string }>;
}
