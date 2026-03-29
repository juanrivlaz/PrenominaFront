import { Injectable, OnDestroy } from "@angular/core";
import { SecureConfigService } from "@core/services/config/secure-config.service";
import * as signalR from "@microsoft/signalr";

@Injectable({
  providedIn: "root",
})
export class SocketService implements OnDestroy {
  private hubConnection: signalR.HubConnection | null = null;
  private readonly hubUrl: string;
  private reconnectAttempts = 0;
  private readonly maxReconnectAttempts = 5;
  private isConnecting = false;

  constructor(private readonly secureConfig: SecureConfigService) {
    this.hubUrl = this.secureConfig.socketUrl;
  }

  ngOnDestroy(): void {
    this.stopConnection();
  }

  public startConnection(): void {
    if (this.isConnecting || this.hubConnection?.state === signalR.HubConnectionState.Connected) {
      return;
    }

    this.isConnecting = true;

    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: (retryContext) => {
          if (retryContext.previousRetryCount >= this.maxReconnectAttempts) {
            return null; // Stop retrying
          }
          // Exponential backoff: 1s, 2s, 4s, 8s, 16s
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 16000);
        }
      })
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    this.hubConnection
      .start()
      .then(() => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        // Connection established - no console.log in production
      })
      .catch((err: Error) => {
        this.isConnecting = false;
        this.handleConnectionError(err);
      });

    // Handle connection closed
    this.hubConnection.onclose((error) => {
      if (error) {
        this.handleConnectionError(error);
      }
    });
  }

  private handleConnectionError(error: Error): void {
    // Log error safely without exposing sensitive information
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => this.startConnection(), 5000);
    }
  }

  public addListener(eventName: string, callback: (...args: unknown[]) => void): void {
    if (!eventName || typeof eventName !== 'string') {
      return;
    }

    if (this.hubConnection) {
      this.hubConnection.on(eventName, callback);
    }
  }

  public removeListener(eventName: string): void {
    if (!eventName || typeof eventName !== 'string') {
      return;
    }

    if (this.hubConnection) {
      this.hubConnection.off(eventName);
    }
  }

  public stopConnection(): void {
    if (this.hubConnection) {
      this.hubConnection
        .stop()
        .catch(() => {
          // Silently handle stop errors
        })
        .finally(() => {
          this.hubConnection = null;
          this.isConnecting = false;
        });
    }
  }

  public get connectionState(): signalR.HubConnectionState | null {
    return this.hubConnection?.state ?? null;
  }
}
