import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";

@Injectable()
export class FileIncidentService {
    constructor(private readonly httpService: HttpClient) {}
}