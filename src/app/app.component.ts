import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { AppConfigService } from '@core/services/app-config/app-config.service';
import { AppNavbar } from '@shared/components/navbar/navbar.component';
import { AppToolbar } from '@shared/components/toolbar/toolbar.component';
import { Subscription } from 'rxjs';
import { AppConfigInterface } from '@core/services/app-config/app-config.interface';
import { MaterialModule } from "@shared/modules/material/material.module";
import { MatSidenavModule } from '@angular/material/sidenav';
import { CommonModule } from '@angular/common';
import { SplashScreenComponent } from '@shared/components/splash-screen/splash-screen.component';
import { appAnimations } from '@core/animations';
import { SocketService } from '@core/services/socket/socket.service';

@Component({
  selector: 'app-main',
  imports: [
    CommonModule,
    AppToolbar,
    AppNavbar,
    RouterOutlet,
    MaterialModule,
    MatSidenavModule,
    SplashScreenComponent,
  ],
  providers: [
    SocketService
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  animations: appAnimations,
  encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit, OnDestroy {
  public readonly onSettingsChanged: Subscription;
  public appSettings: AppConfigInterface;
  private navigationSubscription: Subscription;

  constructor(
    private readonly appConfigService: AppConfigService,
    private readonly router: Router,
    private readonly socketService: SocketService
  ) {
    this.appSettings = this.appConfigService.settings;
    this.onSettingsChanged = this.appConfigService.onSettingsObserver.subscribe((settings) => {
      this.appSettings = settings;
    });

    this.navigationSubscription = this.router.events.subscribe((e: any) => {
      if (e instanceof NavigationEnd) {
        document.getElementById('app-main-router')?.scroll(0, 0);
      }
    })
  }

  ngOnInit(): void {
    this.socketService.startConnection();
    this.socketService.addListener('ReceiveNotification', this.processNotification.bind(this));
  }

  ngOnDestroy(): void {
    this.onSettingsChanged.unsubscribe();
    this.navigationSubscription.unsubscribe();
    this.socketService.stopConnection();
  }

  private processNotification(data: any): void {
    console.log('Received notification:', data);
  }
}
