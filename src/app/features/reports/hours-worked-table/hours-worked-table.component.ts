import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, Input, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
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
export class HoursWorkedTableComponent implements OnChanges {
    @Input() public dataSource: MatTableDataSource<IHoursWorkedReport> = new MatTableDataSource();
    @Input() public totalRecords: number = 0;
    @Input() public pageSize: number = 10;
    @Input() public onPageChange: (event: PageEvent) => void = () => {};
    @ViewChild(MatPaginator) paginator: MatPaginator = {} as MatPaginator;

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

    constructor(private cdr: ChangeDetectorRef) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['pageSize'] || changes['totalRecords']) {
            this.paginator.pageSize = this.pageSize;
            this.paginator.length = this.totalRecords;
            this.cdr.detectChanges();

            this.dataSource.paginator = this.paginator;
        }
    }
}