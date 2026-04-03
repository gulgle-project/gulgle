const entries = [
  {
    key: "github",
    element: (
      <a
        className="text-muted-foreground hover:text-foreground transition-colors duration-200 text-sm"
        href="https://github.com/gulgle-project/gulgle"
        rel="noopener noreferrer"
        target="_blank"
      >
        GitHub
      </a>
    ),
  },
];

export function Footer() {
  return (
    <footer className="w-full mt-auto border-t border-border bg-background/80">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex justify-center items-center gap-1">
          {entries.map((entry, index) => (
            <div className="flex items-center" key={entry.key}>
              {entry.element}
              {index < entries.length - 1 && <span className="mx-3 text-muted-foreground/50 select-none">•</span>}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
