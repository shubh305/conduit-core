/**
 * Reserved keywords that cannot be used as slugs for Tenants (Subdomains)
 * or Posts (Routes).
 */

export const RESERVED_TENANT_SLUGS = [
  "www",
  "kafka",
  "mongo",
  "rtmp",
  "conduit",
  "conduit-api",
  "openstream",
  "openstream-api",
  "kibana",
  "grafana",
  "dozzle",
  "elastic",
  "stats",
  "storage",
  "minio",
  "stream",
  "broker",
  "admin",
  "auth",
  "api",
  "static",
  "assets",
];

export const RESERVED_POST_SLUGS = [
  "dashboard",
  "studio",
  "login",
  "signup",
  "forgot-password",
  "me",
  "search",
  "u",
  "walkthrough",
  "api",
  "settings",
  "archives",
  "tag",
  "about",
  "feeds",
  "admin",
  "config",
  "profile",
  "editor",
  "posts",
  "themes",
  "layouts",
];
