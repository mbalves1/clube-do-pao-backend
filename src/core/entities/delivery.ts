export type DeliveryUser = {
	id: string;
	userId: string;
	document: string;
	phone: string | null;
	modal: 'BIKE' | 'MOTORCYCLE' | 'WALKING';
	status: string;
};
