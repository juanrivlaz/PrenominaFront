import { CommonModule } from "@angular/common";
import { Component, effect, input, output, viewChild, ViewEncapsulation } from "@angular/core";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { IIncidenceReport } from "@core/models/reports/incidences.interface";

@Component({
    selector: 'app-incidences-table',
    templateUrl: './incidences-table.component.html',
    styleUrl: './incidences-table.component.scss',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
    ],
    encapsulation: ViewEncapsulation.None,
})
export class IncidencesTableComponent {
    // Inputs usando signal-based API
    public readonly dataSource = input<MatTableDataSource<IIncidenceReport>>(new MatTableDataSource<IIncidenceReport>([]));
    public readonly totalRecords = input<number>(0);
    public readonly pageSize = input<number>(10);

    // Output usando signal-based API
    public readonly onPageChange = output<PageEvent>();

    // ViewChild usando signal-based API
    public readonly paginator = viewChild<MatPaginator>(MatPaginator);

    public readonly columns: Array<string> = [
        'code',
        'name',
        'department',
        'jobPosition',
        'date',
        'incidenceCode',
        'description',
        'userFullName',
        'createdAt',
    ];

    constructor() {
        // Effect reemplaza ngOnChanges
        effect(() => {
            const paginatorRef = this.paginator();
            const pageSize = this.pageSize();
            const totalRecords = this.totalRecords();
            const dataSource = this.dataSource();

            if (paginatorRef) {
                paginatorRef.pageSize = pageSize;
                paginatorRef.length = totalRecords;
                dataSource.paginator = paginatorRef;
            }
        });
    }
}
