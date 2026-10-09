import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  brand?: string;
}

const SITE_URL = 'https://maintenanceguide.life';
const SITE_NAME = 'Maintenance Guide';
const DEFAULT_IMAGE = `${SITE_URL}/images/hero-bg-professional.webp`;

const SEO: React.FC<SEOProps> = ({ title, description, keywords, brand }) => {
  const pathname = typeof window === 'undefined' ? '/' : window.location.pathname;
  const canonicalUrl = `${SITE_URL}${pathname.replace(/\/$/, '') || '/'}`;
  const fullTitle = `${title} | ${SITE_NAME}`;
  const businessName = brand ? `${SITE_NAME} - ${brand}` : SITE_NAME;

  const schemaOrgJSONLD = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#business`,
    name: businessName,
    description,
    url: SITE_URL,
    telephone: '+201278885772',
    image: DEFAULT_IMAGE,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Alexandria',
      addressCountry: 'EG',
    },
    areaServed: {
      '@type': 'City',
      name: 'Alexandria',
    },
    knowsAbout: [
      'صيانة الثلاجات',
      'صيانة الغسالات',
      'صيانة التكييفات',
      'صيانة البوتاجازات',
    ],
  };

  return (
    <Helmet>
      <html lang="ar" dir="rtl" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content="index,follow,max-image-preview:large" />
      <link rel="canonical" href={canonicalUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ar_EG" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={DEFAULT_IMAGE} />
      <meta property="og:image:alt" content="خدمة صيانة أجهزة منزلية في الإسكندرية" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={DEFAULT_IMAGE} />
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJSONLD)}
      </script>
    </Helmet>
  );
};

export default SEO;
