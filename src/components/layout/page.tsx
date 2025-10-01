export function Page({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <div className={`flex-1 flex flex-col items-center max-w-2xl w-full px-4 ${centered ? "justify-center" : ""}`}>
      {children}
    </div>
  );
}
