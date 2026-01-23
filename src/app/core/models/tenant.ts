export class Tenant {
    public id: number;
    public label: string;
    public company: string;
    public companyId: number;

    public constructor(id?: number, label?: string, company?: string, companyId?: number) {
        this.id = id || 0;
        this.label = label || '';
        this.company = company || '';
        this.companyId = companyId || 0;
    }
}