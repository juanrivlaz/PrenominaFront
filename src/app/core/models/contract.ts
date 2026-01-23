export interface Contract {
    codigo: number;
    company: number;
    folio: number;
    lastName: string;
    mLastName: string;
    name: string;
    ocupation?: number;
    activity?: string;
    schedule?: number;
    seniorityDate?: Date;
    startDate?: Date;
    terminationDate?: Date;
    days?: number;
    expireInDays: number;
    observation?: string;
    applyRehired: boolean;
    contractDays: number;
}