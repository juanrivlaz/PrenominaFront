import { CommonModule } from "@angular/common";
import { Component, effect, input, output, viewChild, ViewEncapsulation } from "@angular/core";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { IAttendanceReport } from "@core/models/reports/attendance.interface";

@Component({
    selector: 'app-attendance-table',
    templateUrl: './attendance-table.component.html',
    styleUrl: './attendance-table.component.scss',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
    ],
    encapsulation: ViewEncapsulation.None,
})
export class AttendanceTableComponent {
    // Inputs usando signal-based API
    public readonly dataSource = input<MatTableDataSource<IAttendanceReport>>(new MatTableDataSource());
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
        'checkIn',
        'checkOut',
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
