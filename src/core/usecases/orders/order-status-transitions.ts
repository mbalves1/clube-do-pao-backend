import { FulfillmentType, OrderStatus } from '../../entities/orders';
import { InvalidOrderStatusTransitionError } from '../../errors/InvalidOrderStatusTransitionError';

export type OrderActor = 'seller' | 'courier';

type TransitionRule = {
	actor: OrderActor;
	// 'ANY' applies regardless of the order's fulfillmentType.
	fulfillmentType: FulfillmentType | 'ANY';
	from: OrderStatus;
	to: OrderStatus;
};

/**
 * Single source of truth for legal `Order` status moves — see ADR-003
 * (seller-order-fulfillment). Does NOT check ownership or the
 * `deliveryPersonId`-null condition for `READY→CANCELED` — those are
 * use-case concerns (`update-order-status-by-seller.ts`, `update-orders.ts`).
 */
const TRANSITIONS: TransitionRule[] = [
	// Seller — any fulfillment.
	{ actor: 'seller', fulfillmentType: 'ANY', from: 'PENDING', to: 'PREPARING' },
	{ actor: 'seller', fulfillmentType: 'ANY', from: 'PREPARING', to: 'READY' },
	{ actor: 'seller', fulfillmentType: 'ANY', from: 'PENDING', to: 'CANCELED' },
	{ actor: 'seller', fulfillmentType: 'ANY', from: 'PREPARING', to: 'CANCELED' },
	{ actor: 'seller', fulfillmentType: 'ANY', from: 'READY', to: 'CANCELED' },

	// Seller — pickup only: confirms the customer collected it.
	{ actor: 'seller', fulfillmentType: 'PICKUP', from: 'READY', to: 'PICKED_UP' },

	// Courier — delivery only.
	{ actor: 'courier', fulfillmentType: 'DELIVERY', from: 'READY', to: 'ACCEPTED' },
	{ actor: 'courier', fulfillmentType: 'DELIVERY', from: 'ACCEPTED', to: 'READY' },
	{ actor: 'courier', fulfillmentType: 'DELIVERY', from: 'ACCEPTED', to: 'PICKED_UP' },
	{ actor: 'courier', fulfillmentType: 'DELIVERY', from: 'PICKED_UP', to: 'DELIVERED' },
];

export function assertOrderTransition(
	from: OrderStatus,
	to: OrderStatus,
	actor: OrderActor,
	fulfillmentType: FulfillmentType,
): void {
	const isLegal = TRANSITIONS.some(
		(rule) =>
			rule.actor === actor &&
			(rule.fulfillmentType === 'ANY' || rule.fulfillmentType === fulfillmentType) &&
			rule.from === from &&
			rule.to === to,
	);

	if (!isLegal) {
		throw new InvalidOrderStatusTransitionError();
	}
}
