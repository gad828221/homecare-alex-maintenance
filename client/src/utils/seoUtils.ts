// ============ SEO UTILITY FOR DYNAMIC META TAGS ============

export interface SEOConfig {
  title: string;
  description: string;
  keywords: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  canonicalUrl?: string;
}

export const updateSEO = (config: SEOConfig) => {
  // Update Title
  document.title = config.title;
  
  // Update Meta Description
  let metaDescription = document.querySelector('meta[name="description"]');
  if (!metaDescription) {
    metaDescription = document.createElement('meta');
    metaDescription.setAttribute('name', 'description');
    document.head.appendChild(metaDescription);
  }
  metaDescription.setAttribute('content', config.description);

  // Update Keywords
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  metaKeywords.setAttribute('content', config.keywords);

  // Update OG Tags
  updateOGTag('og:title', config.ogTitle || config.title);
  updateOGTag('og:description', config.ogDescription || config.description);
  if (config.ogImage) {
    updateOGTag('og:image', config.ogImage);
  }

  // Update Canonical URL
  if (config.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', config.canonicalUrl);
  }

  // Scroll to top
  window.scrollTo(0, 0);
};

const updateOGTag = (property: string, content: string) => {
  let tag = document.querySelector(`meta[property="${property}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
};

// ============ BRAND SEO DATA ============
export const brandSEOData: Record<string, SEOConfig> = {
  samsung: {
    title: "صيانة سامسونج بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة سامسونج (ثلاجات، غسالات، تكييفات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة سامسونج الإسكندرية, تصليح سامسونج, فني سامسونج متخصص, صيانة ثلاجة سامسونج, صيانة غسالة سامسونج, صيانة تكييف سامسونج",
    ogTitle: "صيانة سامسونج احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة سامسونج الموثوقة والسريعة في الإسكندرية",
  },
  lg: {
    title: "صيانة LG بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة LG (ثلاجات، غسالات، تكييفات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة LG الإسكندرية, تصليح LG, فني LG متخصص, صيانة ثلاجة LG, صيانة غسالة LG, صيانة تكييف LG",
    ogTitle: "صيانة LG احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة LG الموثوقة والسريعة في الإسكندرية",
  },
  sharp: {
    title: "صيانة شارب بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة شارب (ثلاجات، غسالات، تكييفات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة شارب الإسكندرية, تصليح شارب, فني شارب متخصص, صيانة ثلاجة شارب, صيانة غسالة شارب, صيانة تكييف شارب",
    ogTitle: "صيانة شارب احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة شارب الموثوقة والسريعة في الإسكندرية",
  },
  toshiba: {
    title: "صيانة توشيبا بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة توشيبا (ثلاجات، غسالات، تكييفات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة توشيبا الإسكندرية, تصليح توشيبا, فني توشيبا متخصص, صيانة ثلاجة توشيبا, صيانة غسالة توشيبا, صيانة تكييف توشيبا",
    ogTitle: "صيانة توشيبا احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة توشيبا الموثوقة والسريعة في الإسكندرية",
  },
  zanussi: {
    title: "صيانة زانوسي بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة زانوسي (ثلاجات، غسالات، تكييفات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة زانوسي الإسكندرية, تصليح زانوسي, فني زانوسي متخصص, صيانة ثلاجة زانوسي, صيانة غسالة زانوسي",
    ogTitle: "صيانة زانوسي احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة زانوسي الموثوقة والسريعة في الإسكندرية",
  },
  unionaire: {
    title: "صيانة يونيون إير بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة يونيون إير (تكييفات، ثلاجات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة يونيون إير الإسكندرية, تصليح يونيون إير, فني يونيون إير, صيانة تكييف يونيون إير",
    ogTitle: "صيانة يونيون إير احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة يونيون إير الموثوقة والسريعة في الإسكندرية",
  },
  fresh: {
    title: "صيانة فريش بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة فريش (ثلاجات، غسالات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة فريش الإسكندرية, تصليح فريش, فني فريش معتمد, صيانة ثلاجة فريش, صيانة غسالة فريش",
    ogTitle: "صيانة فريش احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة فريش الموثوقة والسريعة في الإسكندرية",
  },
  whitewhale: {
    title: "صيانة وايت ويل بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة وايت ويل (ثلاجات، غسالات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة وايت ويل الإسكندرية, تصليح وايت ويل, فني وايت ويل, صيانة ثلاجة وايت ويل, صيانة غسالة وايت ويل",
    ogTitle: "صيانة وايت ويل احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة وايت ويل الموثوقة والسريعة في الإسكندرية",
  },
  ariston: {
    title: "صيانة أريستون بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة أريستون (غسالات، سخانات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة أريستون الإسكندرية, تصليح أريستون, فني أريستون متخصص, صيانة غسالة أريستون, صيانة سخان أريستون",
    ogTitle: "صيانة أريستون احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة أريستون الموثوقة والسريعة في الإسكندرية",
  },
  beko: {
    title: "صيانة بيكو بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة بيكو (ثلاجات، غسالات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة بيكو الإسكندرية, تصليح بيكو, فني بيكو معتمد, صيانة ثلاجة بيكو, صيانة غسالة بيكو",
    ogTitle: "صيانة بيكو احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة بيكو الموثوقة والسريعة في الإسكندرية",
  },
  hoover: {
    title: "صيانة هوفر بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة هوفر (غسالات، مكانس) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة هوفر الإسكندرية, تصليح هوفر, فني هوفر معتمد, صيانة غسالة هوفر",
    ogTitle: "صيانة هوفر احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة هوفر الموثوقة والسريعة في الإسكندرية",
  },
  indesit: {
    title: "صيانة إنديست بالإسكندرية | فني متخصص وضمان على الخدمة",
    description: "متخصصون في صيانة أجهزة إنديست (ثلاجات، غسالات) بالإسكندرية. فنيين متخصصين، قطع غيار مناسبة، وحجز منزلي سريع.",
    keywords: "صيانة إنديست الإسكندرية, تصليح إنديست, فني إنديست معتمد, صيانة ثلاجة إنديست, صيانة غسالة إنديست",
    ogTitle: "صيانة إنديست احترافية بالإسكندرية",
    ogDescription: "خدمات صيانة إنديست الموثوقة والسريعة في الإسكندرية",
  },
};
