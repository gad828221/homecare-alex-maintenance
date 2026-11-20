import React, { useEffect } from 'react';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  brand?: string;
}

const SITE_URL = 'https://www.maintenanceguide.life';
const SITE_NAME = 'Maintenance Guide';
const DEFAULT_IMAGE = `${SITE_URL}/images/hero-bg-professional.webp`;

function setMetaContent(selector: string, createAttrs: Record<string, string>, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    Object.entries(createAttrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function setRobotsMeta(content: string) {
  setMetaContent('meta[name="robots"]', { name: 'robots' }, content);
}

export const HeadTitle: React.FC<{ title: string; description?: string }> = ({ title, description }) => {
  useEffect(() => {
    document.title = title;
    if (description) setMetaContent('meta[name="description"]', { name: 'description' }, description);
  }, [title, description]);
  return null;
};

// Updates the existing static head tags in place instead of adding duplicates.
// (react-helmet-async under React 19 hoists new tags next to the static ones,
// which produced two <title> and two conflicting canonical links per page.)
const SEO: React.FC<SEOProps> = ({ title, description, keywords }) => {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  const canonicalUrl = `${SITE_URL}${pathname.replace(/\/$/, '') || '/'}`;
  const fullTitle = `${title} | ${SITE_NAME}`;

  useEffect(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    document.title = fullTitle;

    setMetaContent('meta[name="title"]', { name: 'title' }, fullTitle);
    setMetaContent('meta[name="description"]', { name: 'description' }, description);
    if (keywords) setMetaContent('meta[name="keywords"]', { name: 'keywords' }, keywords);
    setRobotsMeta('index,follow,max-image-preview:large');

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);

    setMetaContent('meta[property="og:type"]', { property: 'og:type' }, 'website');
    setMetaContent('meta[property="og:locale"]', { property: 'og:locale' }, 'ar_EG');
    setMetaContent('meta[property="og:site_name"]', { property: 'og:site_name' }, SITE_NAME);
    setMetaContent('meta[property="og:url"]', { property: 'og:url' }, canonicalUrl);
    setMetaContent('meta[property="og:title"]', { property: 'og:title' }, fullTitle);
    setMetaContent('meta[property="og:description"]', { property: 'og:description' }, description);
    setMetaContent('meta[property="og:image"]', { property: 'og:image' }, DEFAULT_IMAGE);
    setMetaContent('meta[property="og:image:alt"]', { property: 'og:image:alt' }, 'خدمة صيانة أجهزة منزلية في الإسكندرية');
    setMetaContent('meta[property="twitter:card"]', { property: 'twitter:card' }, 'summary_large_image');
    setMetaContent('meta[property="twitter:url"]', { property: 'twitter:url' }, canonicalUrl);
    setMetaContent('meta[property="twitter:title"]', { property: 'twitter:title' }, fullTitle);
    setMetaContent('meta[property="twitter:description"]', { property: 'twitter:description' }, description);
    setMetaContent('meta[property="twitter:image"]', { property: 'twitter:image' }, DEFAULT_IMAGE);
  }, [fullTitle, description, keywords, canonicalUrl]);

  return null;
};

export default SEO;
