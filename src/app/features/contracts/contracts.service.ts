import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Contract } from "@core/models/contract";
import { Observable } from "rxjs";

@Injectable()
export class ContractsService {
    constructor(private readonly httpService: HttpClient) {}

    public get(): Observable<Array<Contract>> {
        return this.httpService.get<Array<Contract>>('/Contracts');
    }

    public setApplyNewContract(
        Codigo: number,
        Company: number,
        Folio: number,
        GenerateContract: boolean,
        Observation: string,
        ContractDays: number
    ): Observable<Contract> {
        return this.httpService.put<Contract>('/Contracts/set-apply-new-contract', {
            Codigo,
            Company,
            Folio,
            GenerateContract,
            Observation,
            ContractDays
        });
    }

    public download(): Observable<Blob> {
        return this.httpService.get('/Contracts/download', { responseType: 'blob' });
    }
}