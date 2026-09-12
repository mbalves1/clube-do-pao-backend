/**
 * One-off backfill: create one `Order` row per existing `subscription` row.
 *
 * Context: `Order` is becoming the per-service-date system of record
 * (ADR-001, seller-order-fulfillment). Before the courier use cases
 * (list-available-orders / accept-order / release-order / update-orders)
 * switch from `SubscribeRepository` to `OrdersRepository` (tasks 13-16),
 * every existing `subscription` row must have a matching `Order`, or the
 * courier flow regresses.
 *
 * Idempotent and additive:
 * - Relies on the `orders(subscriptionId, serviceDate)` unique constraint
 *   (`createMany({ skipDuplicates: true })`) — safe to re-run.
 * - Never modifies or deletes a `subscription` row.
 * - Creates no `OrderItem` rows (historical baskets don't exist).
 *
 * Usage: npm run backfill:orders
 */
import { OrderStatus, FulfillmentType } from '@prisma/client';
import { prisma } from '../../src/infra/database/prisma-client';

function mapStatus(status: string | null | undefined): OrderStatus {
	switch (status) {
		case 'ACCEPTED':
			return OrderStatus.ACCEPTED;
		case 'PICKED_UP':
			return OrderStatus.PICKED_UP;
		case 'DELIVERED':
			return OrderStatus.DELIVERED;
		case 'CANCELED':
			return OrderStatus.CANCELED;
		default:
			// 'PENDING', 'pending', 'ACTIVE', null, or anything else.
			return OrderStatus.PENDING;
	}
}

async function backfillOrders() {
	const subscriptions = await prisma.subscription.findMany({
		select: {
			id: true,
			bakeryId: true,
			serviceDate: true,
			deliveryPersonId: true,
			status: true,
		},
	});

	if (subscriptions.length === 0) {
		console.log('No subscription rows found. Nothing to backfill.');
		return;
	}

	const { count: created } = await prisma.order.createMany({
		data: subscriptions.map((subscription) => ({
			subscriptionId: subscription.id,
			bakeryId: subscription.bakeryId,
			serviceDate: subscription.serviceDate,
			deliveryPersonId: subscription.deliveryPersonId,
			fulfillmentType: FulfillmentType.DELIVERY,
			status: mapStatus(subscription.status),
		})),
		skipDuplicates: true,
	});

	const skipped = subscriptions.length - created;

	console.log(
		`Backfill complete: ${created} order(s) created, ${skipped} skipped (already had an order).`
	);
}

backfillOrders()
	.catch((error) => {
		console.error('Backfill failed:', error);
		process.exitCode = 1;
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
