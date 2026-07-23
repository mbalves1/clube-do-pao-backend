import { Router } from 'express';
import { AuthController } from '../../controllers/auth-controller';

export function makeAuthRoutes(authController: AuthController) {
	const router = Router();

	/**
	 * @swagger
	 * /api/auth/login:
	 *   post:
	 *     summary: Autentica com email e senha
	 *     tags:
	 *       - Auth
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - email
	 *               - password
	 *             properties:
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 example: murilo@email.com
	 *               password:
	 *                 type: string
	 *                 example: '123456'
	 *     responses:
	 *       200:
	 *         description: Login realizado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 accessToken:
	 *                   type: string
	 *                 refreshToken:
	 *                   type: string
	 *                 expiresIn:
	 *                   type: number
	 *                 role:
	 *                   type: string
	 *                   enum: [customer, delivery, company]
	 *                 profile:
	 *                   type: object
	 *                   properties:
	 *                     id:
	 *                       type: string
	 *                     name:
	 *                       type: string
	 *                     email:
	 *                       type: string
	 *       400:
	 *         description: Dados inválidos
	 *       401:
	 *         description: Email ou senha inválidos
	 */
	router.post('/auth/login', (req, res) => authController.login(req, res));

	/**
	 * @swagger
	 * /api/auth/refresh:
	 *   post:
	 *     summary: Renova a sessão a partir de um refresh token
	 *     tags:
	 *       - Auth
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - refreshToken
	 *             properties:
	 *               refreshToken:
	 *                 type: string
	 *     responses:
	 *       200:
	 *         description: Sessão renovada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: object
	 *               properties:
	 *                 accessToken:
	 *                   type: string
	 *                 refreshToken:
	 *                   type: string
	 *                 expiresIn:
	 *                   type: number
	 *       400:
	 *         description: Dados inválidos
	 *       401:
	 *         description: Sessão expirada, faça login novamente
	 */
	router.post('/auth/refresh', (req, res) => authController.refresh(req, res));

	return router;
}
