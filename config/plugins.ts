import type { Core } from "@strapi/strapi";

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin =>
  // env("NODE_ENV") === "production"
  true
    ? {
        upload: {
          config: {
            provider: "@avorati/strapi-provider-upload-minio",
            providerOptions: {
              host: env("MINIO_HOST") || "localhost",
              port: env("MINIO_PORT") ? parseInt(env("MINIO_PORT")) : undefined,
              // If port is not specified, the provider will automatically use the default port based on useSSL (443 for HTTPS, 9000 for HTTP)
              useSSL: env.bool("MINIO_USE_SSL", true),
              rejectUnauthorized: env("MINIO_REJECT_UNAUTHORIZED") !== "false", // default: true (secure)
              accessKey: env("MINIO_ACCESS_KEY"),
              secretKey: env("MINIO_SECRET_KEY"),
              bucket: env("MINIO_BUCKET") || "strapi-uploads",
              folder: env("MINIO_FOLDER") || "", // optional
            },
          },
        },
      }
    : {};

export default config;
