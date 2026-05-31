export enum NameOrder {
    FirstNameFirst = 0,
    LastNameFirst = 1,
}

export interface IConfigNameFormat {
    order: NameOrder;
}
