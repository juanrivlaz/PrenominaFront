import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Document } from "@core/models/document";
import { Observable } from "rxjs";

@Injectable()
export class DocumentsService {
    constructor(private readonly httpService: HttpClient) {}

    public get(): Observable<Array<Document>> {
        return this.httpService.get<Array<Document>>('/Documents');
    }
}