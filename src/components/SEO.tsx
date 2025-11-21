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
  title = "Oplus – AI Game Engine",
  description = "The infinite game engine. Turn text into playable worlds, interactive stories, and viral mini-games instantly with Oplus AI.",
  image = "https://oplusai.vercel.app/og-image.png",
  url = "https://oplusai.vercel.app",
  type = "website",
  keywords = "AI game engine, create games, AI games, game generator, instant games, Oplus",
  noindex = false,
}: SEOProps) => {
  const fullTitle = title.includes("Oplus") ? title : `${title} | Oplus`;

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
