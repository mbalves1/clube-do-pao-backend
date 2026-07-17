import { UnprocessableEntityError } from '../../errors/UnprocessableEntityError';
import { AuthGateway } from '../../ports/auth-gateway';

export type RefreshSessionDTO = {
	refreshToken: string;
};

export type RefreshSessionResult = {
	accessToken: string;
	refreshToken: string;
	expiresIn: number;
};

export class RefreshSessionUseCase {
	constructor(private authGateway: AuthGateway) {}

	async execute(data: RefreshSessionDTO): Promise<RefreshSessionResult> {
		try {
			return await this.authGateway.refreshSession(data.refreshToken);
		} catch {
			throw new UnprocessableEntityError(
				'Sessão expirada, faça login novamente',
			);
		}
	}
}
