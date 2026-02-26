import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

async function loadRuntimeConfig(): Promise<void> {
  try {
    const response = await fetch('/runtime-config.json');
    if (!response.ok) {
      throw new Error(`No se pudo cargar runtime-config.json`);
    }

    const config = await response.json();
    (window as any).env = config;
  } catch (error) {
    console.error('Error cargando runtime-config.json', error);
    (window as any).env = {}; // fallback seguro
  }
}

async function bootstrap() {
  await loadRuntimeConfig();

  bootstrapApplication(AppComponent, appConfig)
    .catch((err) => console.error(err));
}

bootstrap();