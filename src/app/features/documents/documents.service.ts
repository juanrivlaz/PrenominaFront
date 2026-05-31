import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Document, IDocumentInput } from "@core/models/document";
import { Observable } from "rxjs";

@Injectable()
export class DocumentsService {
    constructor(private readonly httpService: HttpClient) {}

    public get(): Observable<Array<Document>> {
        return this.httpService.get<Array<Document>>('/Documents');
    }

    public getById(id: string): Observable<Document> {
        return this.httpService.get<Document>(`/Documents/${id}`);
    }

    public create(payload: IDocumentInput): Observable<Document> {
        return this.httpService.post<Document>('/Documents', payload);
    }

    public update(id: string, payload: IDocumentInput): Observable<boolean> {
        return this.httpService.put<boolean>(`/Documents/${id}`, payload);
    }

    public delete(id: string): Observable<boolean> {
        return this.httpService.delete<boolean>(`/Documents/${id}`);
    }
}