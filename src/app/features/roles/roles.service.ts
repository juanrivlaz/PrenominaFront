import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { CreateRol } from "@core/models/create-role";
import { Role } from "@core/models/role";
import { Observable } from "rxjs";

@Injectable()
export class RolesService {
    constructor(private readonly httpService: HttpClient) {}

    public create(form: CreateRol): Observable<Role> {
        return this.httpService.post<Role>('/Roles', form);
    }

    public update(id: string, form: CreateRol): Observable<Role> {
        return this.httpService.put<Role>(`/Roles/${id}`, form);
    }

    public get(): Observable<Array<Role>> {
        return this.httpService.get<Array<Role>>('/Roles');
    }
}