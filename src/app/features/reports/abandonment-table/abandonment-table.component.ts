import { CommonModule } from "@angular/common";
import { Component, effect, input, output, viewChild, ViewEncapsulation } from "@angular/core";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { IAbandonmentReport } from "@core/models/reports/abandonment.interface";

@Component({
    selector: 'app-abandonment-table',
    templateUrl: './abandonment-table.component.html',
    styleUrl: './abandonment-table.component.scss',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
    ],
    encapsulation: ViewEncapsulation.None,
})
export class AbandonmentTableComponent {
    public readonly dataSource = input<MatTableDataSource<IAbandonmentReport>>(new MatTableDataSource());
    public readonly totalRecords = input<number>(0);
    public readonly pageSize = input<number>(10);

    public readonly onPageChange = output<PageEvent>();

    public readonly paginator = viewChild<MatPaginator>(MatPaginator);

    public readonly columns: Array<string> = [
        'code',
        'name',
        'department',
        'jobPosition',
        'consecutiveDays',
        'startDate',
        'endDate',
    ];

    constructor() {
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
