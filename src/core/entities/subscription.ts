import { FulfillmentType } from './orders';
import { SubscriptionItem } from './subscription-item';

/**
 * Template recorrente entre um `User` e uma `Bakery` — ver ADR-001
 * (seller-order-fulfillment). A instância por data de serviço é o `Order`,
 * gerado a partir deste template (`GenerateOrdersFromSubscriptionsUseCase`).
 */
export type Subscription = {
	id: number;
	userId: string;
	bakeryId: string;
	frequency: string;
	daysWeek: string[];
	serviceStartAt: string;
	serviceEndAt: string;
	deliveryStartAt: string;
	deliveryEndAt: string;
	notes?: string | null;
	fulfillmentType: FulfillmentType;
	active: boolean;
	items: SubscriptionItem[];
	createdAt: Date;

	/**
	 * @deprecated Coluna legada — descrevia a ocorrência do dia antes do
	 * split Subscription/Order (ADR-001). Mantida só para histórico/backfill;
	 * nenhum código novo escreve aqui. Use `Order.serviceDate`.
	 */
	serviceDate?: Date;
	/**
	 * @deprecated Coluna legada — status da ocorrência do dia antes do split.
	 * Use `Order.status`.
	 */
	status?: string;
	/**
	 * @deprecated Coluna legada — courier da ocorrência do dia antes do split.
	 * Use `Order.deliveryPersonId`.
	 */
	deliveryPersonId?: string | null;
};
