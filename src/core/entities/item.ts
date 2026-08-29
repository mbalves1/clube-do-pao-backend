export type Item = {
	id: string;
	bakeryId: string;
	name: string;
	description?: string | null;
	// Preço em centavos (ex.: 1250 = R$ 12,50), para evitar erros de
	// arredondamento de ponto flutuante — mesma convenção usada por APIs
	// de pagamento (Stripe, Mercado Pago etc.).
	priceCents: number;
	available: boolean;
	createdAt: Date;
	updatedAt: Date;
};
