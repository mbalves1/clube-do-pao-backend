export type User = {
	id: string;
	name: string;
	email: string;
	phone?: string | null;
	zipCode?: string | null;
	street?: string | null;
	number?: string | null;
	district?: string | null;
	city?: string | null;
	state?: string | null;
	favoriteBakeries?: string[];
	appointments?: string[];
	createdAt: Date;
};
