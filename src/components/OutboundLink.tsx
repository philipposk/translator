import { withUtm } from "@/lib/utm";

export function OutboundLink({
  href,
  children,
  campaign,
  className,
  ...rest
}: React.AnchorHTMLAttributes<HTMLAnchorElement> & { campaign?: string }) {
  const url = withUtm(href || "", campaign);
  const external = url.startsWith("http");
  return (
    <a
      href={url}
      className={className}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {children}
    </a>
  );
}
