export type OrderItem = {
	id: number;
	orderId: number;
	itemId: string;
	// Snapshot do item no momento da geração do pedido — ver ADR-002
	// (seller-order-fulfillment). Não é atualizado se o `Item` mudar depois.
	nameSnapshot: string;
	priceCentsSnapshot: number;
	quantity: number;
};
