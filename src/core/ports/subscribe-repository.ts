export interface SubscribeCreateData {
	userId: string;
	bakeryId: string;
	serviceDate: Date;
	serviceStartAt: string;
	serviceEndAt: string;
	status: string;
	notes?: string | null;
}

export interface SubscribeRepository {
	create(data: SubscribeCreateData): Promise<any>;
	getList(userId: string): Promise<any>;
}
