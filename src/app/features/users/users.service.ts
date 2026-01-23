import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { ICreateUser } from "@core/models/create-user";
import { IInitCreateUser } from "@core/models/init-create-user.interface";
import { IUserCompanies } from "@core/models/user-company.interface";
import { IUserWithDetails } from "@core/models/user-with-details.interface";
import { map, Observable } from "rxjs";

@Injectable()
export class UsersService {
    constructor(private readonly httpService: HttpClient) {}

    public init(): Observable<IInitCreateUser> {
        return this.httpService.get<IInitCreateUser>('/User/init');
    }

    public getAll(): Observable<Array<IUserWithDetails>> {
        return this.httpService.get<Array<IUserWithDetails>>('/User').pipe(
            map(users => users.map(user => ({
                ...user,
                userCompanies: user.companies as unknown as Array<IUserCompanies>,
            })))
        );
    }

    public create(form: ICreateUser): Observable<IUserWithDetails> {
        return this.httpService.post<IUserWithDetails>('/User', form).pipe(
            map(user => ({
                ...user,
                userCompanies: user.companies as unknown as Array<IUserCompanies>,
            }))
        );
    }

    public update(userId: string, form: ICreateUser): Observable<IUserWithDetails> {
        return this.httpService.put<IUserWithDetails>(`/User/${userId}`, form).pipe(
            map(user => ({
                ...user,
                userCompanies: user.companies as unknown as Array<IUserCompanies>,
            }))
        );
    }

    public delete(userId: string): Observable<boolean> {
        return this.httpService.delete<boolean>(`/User/${userId}`);
    }
}