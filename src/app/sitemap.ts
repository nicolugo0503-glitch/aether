import type { MetadataRoute } from "next";

const BASE = "https://www.useaether.net";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages = [
    { url: BASE,                          priority: 1.0,  changeFrequency: "weekly"  },
    { url: `${BASE}/pricing`,             priority: 0.9,  changeFrequency: "weekly"  },
    { url: `${BASE}/about`,               priority: 0.8,  changeFrequency: "monthly" },
    { url: `${BASE}/blog`,                priority: 0.8,  changeFrequency: "weekly"  },
    { url: `${BASE}/careers`,             priority: 0.7,  changeFrequency: "monthly" },
    { url: `${BASE}/contact`,             priority: 0.7,  changeFrequency: "monthly" },
    { url: `${BASE}/press`,               priority: 0.6,  changeFrequency: "monthly" },
    { url: `${BASE}/login`,               priority: 0.5,  changeFrequency: "yearly"  },
    { url: `${BASE}/signup`,              priority: 0.9,  changeFrequency: "yearly"  },
    { url: `${BASE}/privacy`,             priority: 0.4,  changeFrequency: "yearly"  },
    { url: `${BASE}/terms`,               priority: 0.4,  changeFrequency: "yearly"  },
    { url: `${BASE}/security`,            priority: 0.4,  changeFrequency: "yearly"  },
    { url: `${BASE}/cookie-policy`,       priority: 0.3,  changeFrequency: "yearly"  },
    { url: `${BASE}/blog/ai-automation-guide`,            priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE}/blog/social-media-autopilot`,         priority: 0.7, changeFrequency: "monthly" },
    { url: `${BASE}/blog/email-outreach-ai`,              priority: 0.7, changeFrequency: "monthly" },
  ] as MetadataRoute.Sitemap;

  return staticPages.map(page => ({
    ...page,
    lastModified: new Date(),
  }));
}
