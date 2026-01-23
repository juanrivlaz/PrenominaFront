export class Company {
    public id: number;
    public rfc: string;
    public name: string;

    public constructor(id?: number, rfc?: string, name?: string) {
        this.id = id || 0;
        this.rfc = rfc || '';
        this.name = name || '';
    }
}