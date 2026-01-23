export class Center {
    public id: string;
    public company: number;
    public departmentName?: string;

    public constructor(id?: string, company?: number, departmentName?: string) {
        this.id = id || '';
        this.company = company || 0;
        this.departmentName = departmentName;
    }
}