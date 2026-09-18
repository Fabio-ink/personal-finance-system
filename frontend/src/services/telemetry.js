export const initTelemetry = async () => {
  const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
  if (!sentryDsn) return;

  try {
    const moduleName = '@sentry/react';
    const Sentry = await import(/* @vite-ignore */ moduleName);
    Sentry.init({
      dsn: sentryDsn,
      integrations: [
        Sentry.browserTracingIntegration(),
        Sentry.replayIntegration()
      ],
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0
    });
  } catch (err) {
    console.warn('[Telemetry] Sentry SDK not present or loaded', err);
  }
};

export const captureException = (error, context = {}) => {
  if (window.Sentry) {
    window.Sentry.captureException(error, { extra: context });
  } else {
    console.error('[Telemetry Error]', error, context);
  }
};
