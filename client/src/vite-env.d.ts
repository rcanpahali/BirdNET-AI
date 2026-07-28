/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_CITY_NAME?: string;
  readonly VITE_ORG_NAME?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
