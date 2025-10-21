import type { AnchorHTMLAttributes, MouseEvent } from "react";
import { type Route, useRouter } from "../../contexts/router-context";

type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
  to: Route;
};

export function Link({ to, children, onClick, ...props }: LinkProps) {
  const { navigate } = useRouter();
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    navigate(to);
  };

  return (
    <a href={to} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}
