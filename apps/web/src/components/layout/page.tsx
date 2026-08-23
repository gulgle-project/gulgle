type PageProps = {
  centerOnShortViewports?: boolean;
  centered?: boolean;
  children: React.ReactNode;
};

export function Page({ centerOnShortViewports = false, centered = false, children }: PageProps) {
  return (
    <div
      className={`flex w-full flex-1 flex-col items-center px-5 ${
        centered
          ? `max-w-3xl justify-center ${centerOnShortViewports ? "" : "[@media(max-height:760px)]:justify-start"}`
          : "max-w-2xl"
      }`}
    >
      {children}
    </div>
  );
}
