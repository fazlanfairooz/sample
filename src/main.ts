import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import * as Sentry from "@sentry/angular";
import { Integrations } from "@sentry/tracing";

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';



if (environment.production) {
  enableProdMode();
}

// Sentry.init({
//   dsn: "https://4dd780e2fdde4d4ebf2e1db44c13fd85@o462299.ingest.sentry.io/5465568",
//   integrations: [
//     new Integrations.BrowserTracing({
//       tracingOrigins: ["localhost", "https://yourserver.io/api"],
//       routingInstrumentation: Sentry.routingInstrumentation,
//     }),
//   ],

//   // We recommend adjusting this value in production, or using tracesSampler
//   // for finer control
//   tracesSampleRate: 1.0,
// });


document.addEventListener('DOMContentLoaded', () => {
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                });
