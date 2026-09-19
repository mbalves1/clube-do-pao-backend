import { OrdersRepository } from '../../ports/orders-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';

interface GenerateOrdersInput {
	date?: string;
}

export class GenerateOrdersFromSubscriptionsUseCase {
	constructor(
		private subscribeRepository: SubscribeRepository,
		private ordersRepository: OrdersRepository,
	) {}

	private parseDate(date: string): Date {
		const [day, month, year] = date.split('-').map(Number);

		return new Date(year, month - 1, day);
	}

	private resolveDate(date?: string): Date {
		if (date) {
			return this.parseDate(date);
		}

		const today = new Date();
		today.setUTCHours(0, 0, 0, 0);

		return today;
	}

	async execute(
		input: GenerateOrdersInput,
	): Promise<{ created: number; skipped: number }> {
		const date = this.resolveDate(input.date);

		const templates =
			await this.subscribeRepository.listActiveTemplatesForDate(date);

		let created = 0;
		let skipped = 0;

		for (const template of templates) {
			const exists = await this.ordersRepository.existsForSubscriptionAndDate(
				template.id,
				date,
			);

			if (exists) {
				skipped++;
				continue;
			}

			await this.ordersRepository.createFromSubscription({
				subscriptionId: template.id,
				bakeryId: template.bakeryId,
				serviceDate: date,
				fulfillmentType: template.fulfillmentType,
				items: template.items,
			});
			created++;
		}

		return { created, skipped };
	}
}
