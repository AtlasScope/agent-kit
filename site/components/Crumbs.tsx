import Link from "next/link";
import { SITE } from "@/lib/site";

// Breadcrumbs plus their BreadcrumbList structured data.
export function Crumbs({ items }: { items: [string, string][] }) {
  const all: [string, string][] = [["Agent Kit", "/"], ...items];
  const ld = {
    "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: all.map(([name, href], i) => ({ "@type": "ListItem", position: i + 1, name, item: `${SITE.url}${href}` })),
  };
  return (
    <nav aria-label="Breadcrumb">
      <ol className="crumbs">
        {all.map(([name, href], i) => (
          <li key={href}>{i === all.length - 1 ? <span aria-current="page">{name}</span> : <Link href={href}>{name}</Link>}</li>
        ))}
      </ol>
      <JsonLd data={ld} />
    </nav>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
