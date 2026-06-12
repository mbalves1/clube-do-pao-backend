import { createClient } from '@supabase/supabase-js';
import { Request, Response, NextFunction } from 'express';
import { User } from '@supabase/supabase-js';

declare global {
	namespace Express {
		interface Request {
			user: User;
		}
	}
}

const supabase = createClient(
	process.env.SUPABASE_URL!,
	process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function authMiddleware(
	req: Request,
	res: Response,
	next: NextFunction,
): Promise<void> {
	const token = req.headers.authorization?.replace('Bearer ', '');

	if (!token) {
		res.status(401).json({ error: 'Token não fornecido' });
		return;
	}

	const { data, error } = await supabase.auth.getUser(token);

	if (error || !data.user) {
		res.status(401).json({ error: 'Token inválido ou expirado' });
		return;
	}

	req.user = data.user;
	next();
}
