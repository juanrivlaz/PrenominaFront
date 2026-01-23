import { Injectable } from "@angular/core";
import { MatPaginatorIntl } from "@angular/material/paginator";

@Injectable()
export class PagintionTranslation extends MatPaginatorIntl {
    constructor() {
        super();

        this.itemsPerPageLabel = 'Elementos por página';
        this.nextPageLabel = 'Siguiente página';
        this.previousPageLabel = 'Página anterior';
        this.firstPageLabel = 'Primera página';
        this.lastPageLabel = 'Última página';
        this.getRangeLabel = this.rangeLabel;
    }

    private rangeLabel(page: number, pageSize: number, length: number): string {
        if (length === 0 || pageSize === 0) {
            return `0 de ${length}`;
        }

        length = Math.max(length, 0);
        const startIndex = page * pageSize;
        const endIndex = startIndex < length ? Math.min(startIndex + pageSize, length) : startIndex + pageSize;

        return `${startIndex} - ${endIndex} de ${length}`;
    }
}