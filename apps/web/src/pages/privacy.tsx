// biome-ignore-all lint/security/noDangerouslySetInnerHtml: The policy is a trusted, repository-owned static fragment bundled by Vite.
import { Page } from "@/components/layout/page";
import privacyPolicy from "@/content/privacy-policy.html?raw";

export function PrivacyPage() {
  return (
    <Page>
      <article
        className="w-full py-10 text-sm leading-7 text-muted-foreground sm:py-14 [&_a]:font-medium [&_a]:text-foreground [&_a]:underline [&_a]:decoration-border [&_a]:underline-offset-4 hover:[&_a]:decoration-foreground [&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:font-semibold [&_h1]:tracking-tight [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:mt-9 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:pl-1 [&_p]:mt-3 [&_strong]:font-semibold [&_strong]:text-foreground [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6"
        dangerouslySetInnerHTML={{ __html: privacyPolicy }}
      />
    </Page>
  );
}
