import { Router } from 'express';
import { ItemController } from '../../controllers/item-controller';
import { authMiddleware } from '../../../middlewares/auth';
import { validateSchema } from '../../../middlewares/validate-schema';
import { createItemSchema, updateItemSchema } from '../validators/item-validator';

export function makeItemRoutes(itemController: ItemController) {
	const router = Router();

	/**
	 * @swagger
	 * /items:
	 *   get:
	 *     summary: Lista os itens da padaria do lojista autenticado
	 *     tags:
	 *       - Items
	 *     security:
	 *       - bearerAuth: []
	 *     responses:
	 *       200:
	 *         description: Lista de itens retornada com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               type: array
	 *               items:
	 *                 $ref: '#/components/schemas/Item'
	 *       403:
	 *         description: Usuário não está vinculado a uma padaria
	 *       500:
	 *         description: Erro interno do servidor
	 *   post:
	 *     summary: Cadastra um novo item à venda na padaria do lojista autenticado
	 *     tags:
	 *       - Items
	 *     security:
	 *       - bearerAuth: []
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/CreateItem'
	 *     responses:
	 *       201:
	 *         description: Item criado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Item'
	 *       400:
	 *         description: Dados inválidos
	 *       403:
	 *         description: Usuário não está vinculado a uma padaria
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router
		.route('/items')
		.get(authMiddleware, (req, res) => itemController.list(req, res))
		.post(
			authMiddleware,
			validateSchema(createItemSchema),
			(req, res) => itemController.create(req, res),
		);

	/**
	 * @swagger
	 * /items/{id}:
	 *   patch:
	 *     summary: Edita um item da padaria do lojista autenticado
	 *     tags:
	 *       - Items
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         example: "e0758e45-fd77-4dfc-86ad-dab31b7932ed"
	 *     requestBody:
	 *       required: true
	 *       content:
	 *         application/json:
	 *           schema:
	 *             $ref: '#/components/schemas/UpdateItem'
	 *     responses:
	 *       200:
	 *         description: Item atualizado com sucesso
	 *         content:
	 *           application/json:
	 *             schema:
	 *               $ref: '#/components/schemas/Item'
	 *       400:
	 *         description: Dados inválidos
	 *       403:
	 *         description: Você não tem permissão para editar este item
	 *       404:
	 *         description: Item não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 *   delete:
	 *     summary: Exclui um item da padaria do lojista autenticado
	 *     tags:
	 *       - Items
	 *     security:
	 *       - bearerAuth: []
	 *     parameters:
	 *       - in: path
	 *         name: id
	 *         required: true
	 *         schema:
	 *           type: string
	 *         example: "e0758e45-fd77-4dfc-86ad-dab31b7932ed"
	 *     responses:
	 *       204:
	 *         description: Item excluído com sucesso
	 *       403:
	 *         description: Você não tem permissão para excluir este item
	 *       404:
	 *         description: Item não encontrado
	 *       500:
	 *         description: Erro interno do servidor
	 */
	router
		.route('/items/:id')
		.patch(
			authMiddleware,
			validateSchema(updateItemSchema),
			(req, res) => itemController.update(req, res),
		)
		.delete(authMiddleware, (req, res) => itemController.delete(req, res));

	return router;
}
