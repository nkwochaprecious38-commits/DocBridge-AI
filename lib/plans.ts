// Prices and billing period were read from the Selar checkout pages on 24 November 2026.
// Selar does not publish feature lists or usage limits on those pages, so limits below are
// editable placeholders. Replace `limits` and `features` with your confirmed plan terms.
export type Plan = {
  id: "starter" | "professional" | "enterprise";
  name: string;
  price: string;
  period: string;
  url: string;
  highlighted?: boolean;
  blurb: string;
  features: string[];
  limits: { documents: string; storage: string; ai: string };
};

const TBC = "To be confirmed by your administrator";

export const PLANS: Plan[] = [
  {
    id: "starter", name: "Starter", price: "$47", period: "per month",
    url: "https://selar.com/47plan?currency=USD",
    blurb: "For individuals and small teams beginning to organize their documents.",
    features: ["Document upload and parsing", "Search across your library", "Document chat with citations", "Structured data extraction"],
    limits: { documents: TBC, storage: TBC, ai: TBC },
  },
  {
    id: "professional", name: "Professional", price: "$57", period: "per month",
    url: "https://selar.com/57plan?currency=USD", highlighted: true,
    blurb: "For teams that run recurring document processes together.",
    features: ["Everything in Starter", "Custom extraction schemas", "Workflow automation and approvals", "Team workspaces and roles"],
    limits: { documents: TBC, storage: TBC, ai: TBC },
  },
  {
    id: "enterprise", name: "Enterprise", price: "$97", period: "per month",
    url: "https://selar.com/97plan?currency=USD",
    blurb: "For organizations with higher volume and governance needs.",
    features: ["Everything in Professional", "Audit logs and retention controls", "Data export and deletion workflows", "Integration planning support"],
    limits: { documents: TBC, storage: TBC, ai: TBC },
  },
];
