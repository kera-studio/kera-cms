import type { Core } from "@strapi/strapi";

const config = ({
  env,
}: Core.Config.Shared.ConfigParams): Core.Config.Middlewares => {
  const minioHost = env("MINIO_HOST");

  return [
    "strapi::logger",
    "strapi::errors",
    {
      name: "strapi::security",
      config: {
        contentSecurityPolicy: {
          useDefaults: true,
          directives: {
            "connect-src": ["'self'", "https:"],
            "img-src": [
              "'self'",
              "data:",
              "blob:",
              "market-assets.strapi.io",
              ...(minioHost ? [`https://${minioHost}`] : []),
            ],
            "media-src": [
              "'self'",
              "data:",
              "blob:",
              ...(minioHost ? [`https://${minioHost}`] : []),
            ],
            "script-src": [
              "'self'",
              "'unsafe-inline'",
              "cdn.jsdelivr.net",
              "strapi.io",
            ],
            "style-src": ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
            upgradeInsecureRequests: null,
          },
        },
      },
    },
    "strapi::cors",
    "strapi::poweredBy",
    "strapi::query",
    "strapi::body",
    "strapi::session",
    "strapi::favicon",
    "strapi::public",
  ];
};

export default config;
