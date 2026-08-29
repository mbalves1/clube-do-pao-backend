import { Router } from 'express';
import { BakeryController } from '../../controllers/bakery-controller';
import { authMiddleware } from '../../../middlewares/auth';
import { validateSchema } from '../../../middlewares/validate-schema';
import { createBakerySchema } from '../validators/bakery-validator';

export function makeBakeryRoutes(bakeryController: BakeryController) {
	const router = Router();

	/**
	 * @swagger
	 * /api/bakery:
	 *   get:
	 *     summary: Lista padarias
	 *     tags:
	 *       - Bakery
	 *     responses:
	 *       201:
	 *         description: Lista de padarias retornada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/Bakery'
	 *       400:
	 *         description: Erro ao listar padarias
	 *   post:
	 *     summary: Cadastra a padaria do lojista autenticado
	 *     tags:
	 *       - Bakery
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             type: object
	 *             required:
	 *               - name
	 *               - cnpj
	 *               - email
	 *               - phone
	 *               - whatsapp
	 *               - serviceStartAt
	 *               - serviceEndAt
	 *             properties:
	 *               name:
	 *                 type: string
	 *               cnpj:
	 *                 type: string
	 *               email:
	 *                 type: string
	 *               phone:
	 *                 type: string
	 *               whatsapp:
	 *                 type: string
	 *               serviceStartAt:
	 *                 type: string
	 *               serviceEndAt:
	 *                 type: string
	 *     responses:
	 *       201:
	 *         description: Padaria cadastrada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Bakery'
	 *       400:
	 *         description: Dados inválidos
	 *       401:
	 *         description: Token não fornecido ou inválido
	 *       404:
	 *         description: Usuário não encontrado
	 *       409:
	 *         description: Usuário já vinculado a uma padaria, ou CNPJ já em uso
	 */
	router
		.route('/bakery')
		.get((req, res) => bakeryController.list(req, res))
		.post(
			authMiddleware,
			validateSchema(createBakerySchema),
			(req, res) => bakeryController.create(req, res),
		);

	return router;
}
