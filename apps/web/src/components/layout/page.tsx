export function Page({ children, centered = false }: { children: React.ReactNode; centered?: boolean }) {
  return (
    <div
      className={`flex w-full flex-1 flex-col items-center px-5 ${
        centered ? "max-w-3xl justify-center [@media(max-height:760px)]:justify-start" : "max-w-2xl"
      }`}
    >
      {children}
    </div>
  );
}
