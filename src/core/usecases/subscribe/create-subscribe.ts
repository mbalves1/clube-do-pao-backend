import { FulfillmentType } from '../../entities/orders';
import { BakeryRepository } from '../../ports/bakery-repository';
import { ItemRepository } from '../../ports/item-repository';
import { SubscribeRepository } from '../../ports/subscribe-repository';
import { UserRepository } from '../../ports/user-repository';

interface CreateSubscribeInput {
	frequency: 'daily' | 'weekly' | 'monthly';
	deliveryStartAt: string;
	deliveryEndAt: string;
	serviceStartAt: string;
	serviceEndAt: string;
	notes: string;
	daysWeek?: string[];
	fulfillmentType?: FulfillmentType;
	items?: { itemId: string; quantity: number }[];
}

export class CreateSubscribeUseCase {
	constructor(
		private userRepository: UserRepository,
		private bakeryRepository: BakeryRepository,
		private subscribeRepository: SubscribeRepository,
		private itemRepository: ItemRepository,
	) {}

	private weekMap: Record<string, number> = {
		sunday: 0,
		monday: 1,
		tuesday: 2,
		wednesday: 3,
		thursday: 4,
		friday: 5,
		saturday: 6,
	};

	private parseDate(date: string): Date {
		const [day, month, year] = date.split('-').map(Number);

		return new Date(year, month - 1, day);
	}

	async execute(
		idUser: string,
		idBakery: string,
		subscribe: CreateSubscribeInput,
	): Promise<any> {
		const existingUser = await this.userRepository.findById(idUser);
		if (!existingUser) {
			throw new Error('usuario nao encontrado');
		}

		const existBakery = await this.bakeryRepository.findUnique(idBakery);
		if (!existBakery) {
			throw new Error('padaria nao encontrado');
		}

		const fulfillmentType = subscribe.fulfillmentType ?? 'DELIVERY';
		const items = subscribe.items ?? [];

		if (items.length > 0) {
			const bakeryItems = await this.itemRepository.findByBakeryId(idBakery);
			const bakeryItemIds = new Set(bakeryItems.map((item) => item.id));

			const invalidItem = items.find((item) => !bakeryItemIds.has(item.itemId));
			if (invalidItem) {
				throw new Error('Item não pertence à padaria informada');
			}
		}

		const startDate = this.parseDate(subscribe.serviceStartAt);
		const endDate = this.parseDate(subscribe.serviceEndAt);

		if (subscribe.frequency === 'daily') {
			const currentDate = new Date(startDate);

			while (currentDate <= endDate) {
				const created = await this.subscribeRepository.create({
					userId: idUser,
					bakeryId: idBakery,
					serviceDate: new Date(currentDate),
					serviceStartAt: subscribe.serviceStartAt,
					serviceEndAt: subscribe.serviceEndAt,
					frequency: subscribe.frequency,
					deliveryStartAt: subscribe.deliveryStartAt,
					deliveryEndAt: subscribe.deliveryEndAt,
					status: 'PENDING',
					notes: subscribe.notes,
					fulfillmentType,
				});

				if (items.length > 0) {
					await this.subscribeRepository.setItems(created.id, items);
				}

				currentDate.setDate(currentDate.getDate() + 1);
			}
		}

		if (subscribe.frequency === 'weekly' && subscribe.daysWeek?.length) {
			const selectedDays = subscribe.daysWeek.map((day) => ({
				name: day,
				weekDay: this.weekMap[day.toLowerCase()],
			}));

			const currentDate = new Date(startDate);

			while (currentDate <= endDate) {
				const currentWeekDay = currentDate.getDay();
				const selectedDay = selectedDays.find(
					(day) => day.weekDay === currentWeekDay,
				);

				if (selectedDay) {
					const created = await this.subscribeRepository.create({
						userId: idUser,
						bakeryId: idBakery,
						serviceDate: new Date(currentDate),
						serviceStartAt: subscribe.serviceStartAt,
						serviceEndAt: subscribe.serviceEndAt,
						frequency: subscribe.frequency,
						deliveryStartAt: subscribe.deliveryStartAt,
						deliveryEndAt: subscribe.deliveryEndAt,
						status: 'PENDING',
						daysWeek: [selectedDay.name],
						notes: subscribe.notes,
						fulfillmentType,
					});

					if (items.length > 0) {
						await this.subscribeRepository.setItems(created.id, items);
					}
				}

				currentDate.setDate(currentDate.getDate() + 1);
			}
		}
	}
}
