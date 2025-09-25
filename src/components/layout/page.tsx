export function Page({ children }: { children: React.ReactNode }) {
  return <div className="flex-1 flex flex-col items-center justify-center max-w-2xl w-full px-4">{children}</div>;
}
