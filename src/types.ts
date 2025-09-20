// Types
export type BuiltInBang = {
  t: string; // trigger
  s: string; // name/description
  u: string; // url template
  d: string; // domain
  ts?: string[]; // additional triggers (optional)
};

export type CustomBang = BuiltInBang & {
  c: true;
};

export type Bang = BuiltInBang | CustomBang;

export type ExportedSettings = {
  customBangs: CustomBang[];
  defaultBang: Bang | CustomBang | undefined;
  exportedAt: string;
  version: string;
}
