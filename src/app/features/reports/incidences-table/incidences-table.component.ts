import { CommonModule } from "@angular/common";
import { ChangeDetectorRef, Component, Input, OnChanges, Output, SimpleChanges, ViewChild, ViewEncapsulation } from "@angular/core";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
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
export class IncidencesTableComponent implements OnChanges {
  @Input() public dataSource: MatTableDataSource<IIncidenceReport> = new MatTableDataSource<IIncidenceReport>([]);
  @Input() public totalRecords: number = 0;
  @Input() public pageSize: number = 10;
  @Output() public onPageChange: (event: any) => void = () => {};
  @ViewChild(MatPaginator) paginator: MatPaginator = {} as MatPaginator;

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

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges): void {
    //Called before any other lifecycle hook. Use it to inject dependencies, but avoid any serious work here.
    //Add '${implements OnChanges}' to the class.
    if (changes['pageSize'] || changes['totalRecords']) {
      this.paginator.pageSize = this.pageSize;
      this.paginator.length = this.totalRecords;
      this.cdr.detectChanges();

      this.dataSource.paginator = this.paginator;
    }
  }
}