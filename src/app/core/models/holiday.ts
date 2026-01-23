export class Holiday {
    public id: string;
    public date: Date;
    public dominical: boolean;
    public isUnion: boolean;
    public description?: string;
    public incidentCode?: string;

    public constructor(
        id?: string,
        date?: Date,
        dominical?: boolean,
        isUnion?: boolean,
        description?: string,
        incidentCode?: string
    ) {
        this.id = id || '';
        this.date = date || new Date();
        this.dominical = dominical || false;
        this.isUnion = isUnion || false,
        this.description = description;
        this.incidentCode = incidentCode;
    }
}