// Types
export type BuiltInBang = {
  t: string; // trigger
  s: string; // name/description
  u: string; // url template
  d: string; // domain
  ts?: Array<string>; // additional triggers (optional)
};

export type CustomBang = BuiltInBang & {
  c: true;
};

export type Bang = BuiltInBang | CustomBang;

export type ExportedSettings = {
  customBangs: Array<CustomBang>;
  defaultBang: Bang | CustomBang | undefined;
  exportedAt: string;
  version: string;
};
