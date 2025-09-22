// Types
export type Bang = {
  t: string; // trigger
  s: string; // name/description
  u: string; // url template
  d: string; // domain
  ts?: string[]; // additional triggers (optional)
};

export type CustomBang = Bang & {
  c: true;
};
