import { Injectable } from "@angular/core";
import { environment } from "src/environments/environment";
import * as signalR from "@microsoft/signalr";

@Injectable({
  providedIn: "root",
})
export class SocketService {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl: string = "";

  constructor() {
    const apiUrl = (window as any).env?.apiUrl;
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;

    if (environment.production) {
      const url = apiUrl || `${protocol}//${hostname}:5000/api` || environment.apiUrl;
      this.hubUrl = url.replace("/api", "/socket-notification");
    } else {
      this.hubUrl = environment.apiUrl.replace("/api", "/socket-notification");
    }
  }

  public startConnection(): void {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .build();

    this.hubConnection
      .start()
      .then(() => console.log("SignalR Connection Started"))
      .catch((err) => console.log("Error while starting connection: " + err));
  }

  public addListener(eventName: string, callback: (...args: any[]) => void): void {
    if (this.hubConnection) {
      this.hubConnection.on(eventName, callback);
    } else {
      console.error("Hub connection is not established.");
    }
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .then(() => console.log("SignalR Connection Stopped"))
        .catch((err) => console.log("Error while stopping connection: " + err));
    }
  }
}