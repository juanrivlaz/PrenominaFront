import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable } from "rxjs";

export interface IApproverDelegation {
    id: string;
    userId: string;
    userName: string;
    delegateUserId: string;
    delegateUserName: string;
    fromDate: string;
    toDate?: string;
    isActive: boolean;
}

export interface ISaveApproverDelegation {
    userId: string;
    delegateUserId: string;
    fromDate: string;
    toDate?: string | null;
}

export interface ISimpleUser {
    id: string;
    name: string;
}

@Injectable()
export class ApproverDelegationsService {
    constructor(private readonly httpService: HttpClient) {}

    public get(): Observable<Array<IApproverDelegation>> {
        return this.httpService.get<Array<IApproverDelegation>>('/ApproverDelegation');
    }

    public getUsers(): Observable<Array<ISimpleUser>> {
        return this.httpService.get<Array<ISimpleUser>>('/User');
    }

    public store(form: ISaveApproverDelegation): Observable<unknown> {
        return this.httpService.post('/ApproverDelegation', form);
    }

    public delete(id: string): Observable<unknown> {
        return this.httpService.delete(`/ApproverDelegation/${id}`);
    }
}
