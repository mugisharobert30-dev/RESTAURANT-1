import type { Metadata } from "next";
import { Hero } from "@/components/home/hero";
import { PopularDishes, HowItWorks, PromoStrip, ReservationCta } from "@/components/home/sections";
import { ReviewsStrip } from "@/components/home/reviews-strip";

export const metadata: Metadata = {
  title: "Luwombo Restaurant — Authentic Rwandan Cuisine in Kigali",
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Restaurant",
  name: "Luwombo Restaurant",
  servesCuisine: ["Rwandan", "African", "International"],
  priceRange: "RWF 1,000 – RWF 25,000",
  address: {
    "@type": "PostalAddress",
    streetAddress: "KG 652 St, Kimihurura",
    addressLocality: "Kigali",
    addressRegion: "Gasabo",
    addressCountry: "RW",
  },
  geo: { "@type": "GeoCoordinates", latitude: -1.9441, longitude: 30.0619 },
  telephone: "+250788123456",
  email: "hello@luwombo.rw",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  acceptsReservations: "True",
  openingHoursSpecification: [
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday"], opens: "07:00", closes: "22:30" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Friday"], opens: "07:00", closes: "23:30" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Saturday"], opens: "08:00", closes: "23:30" },
    { "@type": "OpeningHoursSpecification", dayOfWeek: ["Sunday"], opens: "08:00", closes: "22:00" },
  ],
  aggregateRating: { "@type": "AggregateRating", ratingValue: "4.8", reviewCount: "912" },
};

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Hero />
      <PopularDishes />
      <HowItWorks />
      <PromoStrip />
      <ReviewsStrip />
      <ReservationCta />
    </>
  );
}
