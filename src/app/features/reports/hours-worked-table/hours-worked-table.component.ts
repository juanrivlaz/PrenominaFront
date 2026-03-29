import { CommonModule } from "@angular/common";
import { Component, effect, input, output, viewChild, ViewEncapsulation } from "@angular/core";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { IHoursWorkedReport } from "@core/models/reports/hours-worked.interface";

@Component({
    selector: 'app-hours-worked-table',
    templateUrl: './hours-worked-table.component.html',
    styleUrl: './hours-worked-table.component.scss',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
    ],
    encapsulation: ViewEncapsulation.None,
})
export class HoursWorkedTableComponent {
    // Inputs usando signal-based API
    public readonly dataSource = input<MatTableDataSource<IHoursWorkedReport>>(new MatTableDataSource());
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
        'checkIn',
        'checkOut',
        'date',
        'hoursWorked',
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
