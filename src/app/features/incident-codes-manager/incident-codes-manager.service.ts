import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { IIncidentCode } from "@core/models/incident-code.interface";
import { IStoreIncidentCode } from "@core/models/store-incident-code.interface";
import { IUser } from "@core/models/user.interface";
import { Observable } from "rxjs";

@Injectable()
export class IncidentCodesManagerService {
    constructor(private readonly httpService: HttpClient) {}

    public getInit(): Observable<Array<IUser>> {
        return this.httpService.get<Array<IUser>>('/IncidentCode/init');
    }

    public get(): Observable<Array<IIncidentCode>> {
        return this.httpService.get<Array<IIncidentCode>>('/IncidentCode');
    }

    public store(form: IStoreIncidentCode): Observable<IIncidentCode> {
        return this.httpService.post<IIncidentCode>('/IncidentCode', form);
    }

    public update(code: string, form: IStoreIncidentCode): Observable<IIncidentCode> {
        return this.httpService.put<IIncidentCode>(`/IncidentCode/${code}`, form);
    }
}