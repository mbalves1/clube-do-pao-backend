import { Bakery } from './../entities/bakery';
import { BakeryCreateData } from '../mappers/bakery-mapper';

export interface BakeryRepository {
	find(): Promise<Bakery[]>;
	findByCnpj(cnpj: string): Promise<Bakery | null>;
	findUnique(id: string): Promise<Bakery | null>;
	create(data: BakeryCreateData): Promise<Bakery>;
}
