import { Router } from 'express';
import { BakeryController } from '../../controllers/bakery-controller';

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
	 */
	router.get('/bakery', (req, res) => bakeryController.list(req, res));

	return router;
}
