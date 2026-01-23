import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, Input, OnChanges, Output, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
import { MatPaginator, MatPaginatorModule, PageEvent } from "@angular/material/paginator";
import { MatTableDataSource, MatTableModule } from "@angular/material/table";
import { IDelayReport } from "@core/models/reports/delays.interface";

@Component({
    selector: 'app-delays-table',
    templateUrl: './delays-table.component.html',
    styleUrl: './delays-table.component.scss',
    imports: [
        CommonModule,
        MatTableModule,
        MatPaginatorModule,
    ],
    encapsulation: ViewEncapsulation.None,
})
export class DelaysTableComponent implements OnChanges {
    @Input() public dataSource: MatTableDataSource<IDelayReport> = new MatTableDataSource();
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
        'timeDelayed',
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