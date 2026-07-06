/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
  readonly VITE_TWIN_URL?: string;
  readonly VITE_PROFILE_OWNER_ID?: string;
  readonly VITE_OWNER_TOKEN?: string;
  readonly VITE_ORCHESTRATOR_URL?: string;
  readonly VITE_ORCHESTRATOR_OWNER_ID?: string;
  readonly VITE_PROFILE_DELIVERY_OWNER_ID?: string;
  readonly VITE_PROFILE_DELIVERY_SLUG?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY: string;
  // Add more environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
