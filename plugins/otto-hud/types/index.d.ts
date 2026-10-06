export type Reading = { tokens: number; window: number; percent: number; threshold: number };

declare module "claude-code" {
  interface PluginState {
    "otto-hud": { readings: Reading[] };
  }
}
