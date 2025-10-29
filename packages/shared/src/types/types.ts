// Types
export type BuiltInBang = {
  /** Trigger */
  t: string;
  /** Name/Description */
  s: string;
  /** URL Template */
  u: string;
  /** Domain */
  d: string;
  /** Additional Triggers (Optional) */
  ts?: Array<string>;
};

export type CustomBang = BuiltInBang & {
  /** Is custom bang */
  c: true;
};

export type Bang = BuiltInBang | CustomBang;

export type ExportedSettings = {
  customBangs: Array<CustomBang>;
  defaultBang: Bang | CustomBang | undefined;
  exportedAt: string;
  version: string;
};

// Settings DTO for server sync
export type SettingsDTO = {
  userId: string;
  customBangs: Array<CustomBang>;
  defaultBang: Bang | undefined;
  lastModified: Date;
};
