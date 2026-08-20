import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  keywords?: string;
  brand?: string;
}

const SEO: React.FC<SEOProps> = ({ title, description, keywords, brand }) => {
  const siteName = "Homecare Alex Maintenance";
  const fullTitle = `${title} | ${siteName}`;
  
  const schemaOrgJSONLD = {
    "@context": "http://schema.org",
    "@type": "LocalBusiness",
    "name": fullTitle,
    "description": description,
    "url": "https://maintenanceguide.life",
    "telephone": "01558625259",
    "address": {
      "@type": "PostalAddress",
      "addressLocality": "Alexandria",
      "addressCountry": "EG"
    }
  };

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} /> }
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <script type="application/ld+json">
        {JSON.stringify(schemaOrgJSONLD)}
      </script>
    </Helmet>
  );
};

export default SEO;
