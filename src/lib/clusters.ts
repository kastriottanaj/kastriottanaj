/**
 * Topic clusters.
 *
 * A cluster is a group of posts that exist to feed one commercial page. The
 * posts target task and question phrasing, which is where an independent site
 * can still rank; the hub targets product phrasing, which it will not rank for
 * and does not need to. The linking runs posts -> siblings -> hub, so the hub
 * collects the authority the posts earn.
 *
 * Membership is declared per post via the `cluster` frontmatter field.
 */
export interface Cluster {
  /** The commercial page this cluster feeds. Trailing slash, as the site does. */
  hubHref: string;
  /** Link text for the in-body link back to the hub. */
  hubTitle: string;
  /** One line saying what the hub is, so the link is an offer and not a nag. */
  hubLede: string;
  /** Heading above the sibling links. */
  relatedTitle: string;
  /** Overrides the generic CTA band at the foot of a post in this cluster. */
  ctaTitle: string;
  ctaLede: string;
  /** The band's second button. It promises a page, so it opens in place. */
  ctaLabel: string;
}

export const CLUSTERS: Record<string, Cluster> = {
  "wordpress-bootcamp": {
    hubHref: "/bootcamps/wordpress-bootcamp/",
    hubTitle: "WordPress Bootcamp",
    hubLede:
      "The same build process as these posts, in order, from a blank plan to a live site you can maintain yourself.",
    relatedTitle: "Keep reading",
    ctaTitle: "Want the whole build, in order?",
    ctaLede:
      "Ten modules from planning to launch and maintenance, self-paced, with the checklists I use on client work.",
    ctaLabel: "See the WordPress Bootcamp →",
  },
  "seo-bootcamp": {
    hubHref: "/bootcamps/seo-bootcamp/",
    hubTitle: "SEO Bootcamp",
    hubLede:
      "The client SEO workflow these posts come out of — audit, fix, publish, earn links — taught in the order it actually works.",
    relatedTitle: "Keep reading",
    ctaTitle: "Want the whole workflow, in order?",
    ctaLede:
      "Ten modules from the first audit to the monthly report, self-paced, with the templates I use on client sites.",
    ctaLabel: "See the SEO Bootcamp →",
  },
};

export function getCluster(id: string | undefined): Cluster | undefined {
  return id ? CLUSTERS[id] : undefined;
}
