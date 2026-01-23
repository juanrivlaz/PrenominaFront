export interface IPagedResult<T> {
    items: Array<T>;
    totalRecords: number;
    page: number;
    pageSize: number;
    totalPages: number;
}