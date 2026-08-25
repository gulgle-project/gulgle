export function Footer() {
  return (
    <footer className="flex w-full justify-center border-t border-border px-5 py-5 text-xs text-muted-foreground">
      <nav aria-label="Legal">
        <a className="transition-colors hover:text-foreground" href="/privacy/">
          Privacy Policy
        </a>
      </nav>
    </footer>
  );
}
