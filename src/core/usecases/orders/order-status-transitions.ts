import { FulfillmentType, OrderStatus } from '../../entities/orders';
import { ForbiddenError } from '../../errors/ForbiddenError';
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

function isLegalFor(
	from: OrderStatus,
	to: OrderStatus,
	actor: OrderActor,
	fulfillmentType: FulfillmentType,
): boolean {
	return TRANSITIONS.some(
		(rule) =>
			rule.actor === actor &&
			(rule.fulfillmentType === 'ANY' || rule.fulfillmentType === fulfillmentType) &&
			rule.from === from &&
			rule.to === to,
	);
}

export function canTransition(
	from: OrderStatus,
	to: OrderStatus,
	actor: OrderActor,
	fulfillmentType: FulfillmentType,
): boolean {
	return isLegalFor(from, to, actor, fulfillmentType);
}

/**
 * Throws `ForbiddenError` (403) when the move is legal only for the other
 * actor, and `InvalidOrderStatusTransitionError` (409) when it is legal for
 * nobody.
 */
export function assertOrderTransition(
	from: OrderStatus,
	to: OrderStatus,
	actor: OrderActor,
	fulfillmentType: FulfillmentType,
): void {
	if (isLegalFor(from, to, actor, fulfillmentType)) return;

	const otherActor: OrderActor = actor === 'seller' ? 'courier' : 'seller';
	if (isLegalFor(from, to, otherActor, fulfillmentType)) {
		throw new ForbiddenError('Esta transição de status não é permitida para o seu papel');
	}

	throw new InvalidOrderStatusTransitionError();
}
