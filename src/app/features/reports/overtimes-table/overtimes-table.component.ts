import { CommonModule } from "@angular/common";
import { AfterViewInit, ChangeDetectorRef, Component, Input, OnChanges, Output, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { IOvertimeReport } from "@core/models/reports/overtimes.interface";

@Component({
    selector: 'app-overtimes-table',
    templateUrl: './overtimes-table.component.html',
    styleUrl: './overtimes-table.component.scss',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
    ],
    encapsulation: ViewEncapsulation.None,
})
export class OvertimesTableComponent implements OnChanges {
    @Input() public dataSource: MatTableDataSource<IOvertimeReport> = new MatTableDataSource();
    @Input() public totalRecords: number = 0;
    @Input() public pageSize: number = 10;
    @Output() public onPageChange: (event: PageEvent) => void = () => {};
    @ViewChild(MatPaginator) paginator: MatPaginator = {} as MatPaginator;
    
    public readonly columns: Array<string> = [
        'code',
        'name',
        'department',
        'jobPosition',
        'date',
        'checkIn',
        'checkOut',
        'overtime',
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

    public formatToTime(overtimeMins: number): string {
        const hours = Math.floor(overtimeMins / 60);
        const minutes = overtimeMins % 60;
        return `${hours.toString().padStart(2, '0')} hrs ${minutes.toString().padStart(2, '0')} min`;
    }
}