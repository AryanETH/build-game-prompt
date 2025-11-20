import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: string;
  keywords?: string;
  noindex?: boolean;
}

export const SEO = ({
  title = "Feep - Create & Play AI-Generated Games Instantly",
  description = "Discover, play, and create AI-generated games in seconds. Swipe through endless gaming experiences, remix favorites, and share with millions.",
  image = "https://feep.app/og-image.png",
  url = "https://feep.app",
  type = "website",
  keywords = "AI games, create games, play games online, AI game generator",
  noindex = false,
}: SEOProps) => {
  const fullTitle = title.includes("Feep") ? title : `${title} | Feep`;

  return (
    <Helmet>
      {/* Primary Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="title" content={fullTitle} />
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      <link rel="canonical" href={url} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
    </Helmet>
  );
};
