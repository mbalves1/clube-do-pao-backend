import { createClient } from '@supabase/supabase-js';

import { AuthGateway, AuthSession, Role } from '../../core/ports/auth-gateway';

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export class SupabaseAuthGateway implements AuthGateway {
	async signInWithPassword(email: string, password: string): Promise<AuthSession> {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error || !data.session || !data.user) {
			throw new Error(error?.message ?? 'Falha ao autenticar com Supabase');
		}

		return {
			accessToken: data.session.access_token,
			refreshToken: data.session.refresh_token,
			expiresIn: data.session.expires_in,
			supabaseUserId: data.user.id,
			role: data.user.app_metadata.role as Role,
		};
	}

	async refreshSession(
		refreshToken: string,
	): Promise<Omit<AuthSession, 'supabaseUserId' | 'role'>> {
		const { data, error } = await supabase.auth.refreshSession({
			refresh_token: refreshToken,
		});

		if (error || !data.session) {
			throw new Error(error?.message ?? 'Falha ao renovar sessão com Supabase');
		}

		return {
			accessToken: data.session.access_token,
			refreshToken: data.session.refresh_token,
			expiresIn: data.session.expires_in,
		};
	}

	async createCredential(
		email: string,
		password: string,
		role: Role,
	): Promise<{ supabaseUserId: string }> {
		const { data, error } = await supabase.auth.admin.createUser({
			email,
			password,
			email_confirm: true,
			app_metadata: { role },
		});

		if (error || !data.user) {
			throw new Error(error?.message ?? 'Falha ao criar credencial no Supabase');
		}

		return { supabaseUserId: data.user.id };
	}
}
