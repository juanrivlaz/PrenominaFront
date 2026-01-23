export class Supervisor {
    public id: number;
    public company: number;
    public name?: string;

    public constructor(id?: number, company?: number, name?: string) {
        this.id = id || 0;
        this.company = company || 0;
        this.name = name;
    }
}