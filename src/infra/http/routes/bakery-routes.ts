import { Router } from 'express';
import { BakeryController } from '../../controllers/bakery-controller';
import { authMiddleware } from '../../../middlewares/auth';

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
	 *
	 *   post:
	 *     summary: Cria uma padaria
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
	 *                 example: Padaria Central
	 *               cnpj:
	 *                 type: string
	 *                 example: '12345678000199'
	 *               email:
	 *                 type: string
	 *                 format: email
	 *                 example: padaria@email.com
	 *               phone:
	 *                 type: string
	 *                 example: '11999999999'
	 *               whatsapp:
	 *                 type: string
	 *                 example: '11999999999'
	 *               serviceStartAt:
	 *                 type: string
	 *                 example: '08:00'
	 *               serviceEndAt:
	 *                 type: string
	 *                 example: '18:00'
	 *     responses:
	 *       201:
	 *         description: Padaria criada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Bakery'
	 *       400:
	 *         description: Dados inválidos ou CNPJ já está em uso
	 *       401:
	 *         description: Não autorizado
	 */
	router.get('/bakery', (req, res) => bakeryController.list(req, res));
	router.post('/bakery', authMiddleware, (req, res) =>
		bakeryController.create(req, res),
	);

	return router;
}
