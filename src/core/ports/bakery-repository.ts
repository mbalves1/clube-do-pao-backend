import { Bakery } from './../entities/bakery';

export interface BakeryRepository {
	find(): Promise<Bakery[]>;
	findByCnpj(cnpj: string): Promise<Bakery | null>;
	create(data: any): Promise<any>;
}
