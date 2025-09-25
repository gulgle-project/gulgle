import { Toaster as Sonner, type ToasterProps } from "sonner";
import { useTheme } from "@/hooks/use-theme.hook";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme } = useTheme();

  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-border": "var(--border)",
          "--normal-text": "var(--popover-foreground)",
        } as React.CSSProperties
      }
      theme={theme as ToasterProps["theme"]}
      {...props}
    />
  );
};

export { Toaster };
