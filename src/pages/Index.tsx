import { useEffect, useState } from "react";
import Header from "@/components/home/Header";
import Hero from "@/components/home/Hero";
import WhyUs from "@/components/home/WhyUs";
import FeaturedDestinations from "@/components/home/FeaturedDestinations";
import UniqueExperiences from "@/components/home/UniqueExperiences";
import AIShowcase from "@/components/home/AIShowcase";
import Footer from "@/components/home/Footer";
import { getFeaturedDestinations, getFeaturedTours } from "@/services/homepageService";
import type { IDestination, ITour } from "@/types/models";

const Index = () => {
  const [featuredDestinations, setFeaturedDestinations] = useState<IDestination[]>([]);
  const [featuredTours, setFeaturedTours] = useState<ITour[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    Promise.all([getFeaturedDestinations(), getFeaturedTours()])
      .then(([destRes, tourRes]) => {
        if (!isMounted) return;
        console.log('[HOMEPAGE COMPONENT] Responses:', { destRes, tourRes });
        if (destRes.success) setFeaturedDestinations(destRes.data);
        else setError(destRes.error || destRes.message || "Lỗi tải điểm đến");
        if (tourRes.success) setFeaturedTours(tourRes.data);
        else setError((prev) => prev || tourRes.error || tourRes.message || "Lỗi tải tour");
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || "Đã xảy ra lỗi");
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    console.log('[HOMEPAGE COMPONENT] `featuredTours` state changed:', featuredTours);
  }, [featuredTours]);
  useEffect(() => {
    console.log('[HOMEPAGE COMPONENT] `featuredDestinations` state changed:', featuredDestinations);
  }, [featuredDestinations]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "VietTravel",
    url: "/",
    logo: "/favicon.ico",
    sameAs: [
      "https://facebook.com/",
      "https://instagram.com/",
      "https://youtube.com/",
    ],
  };

  return (
    <main>
        <Header />
      <Hero />
      <WhyUs />
      {error && (
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <h3 className="font-semibold mb-2">Không thể tải dữ liệu</h3>
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-sm underline hover:no-underline"
            >
              Thử lại
            </button>
          </div>
        </div>
      )}
      <FeaturedDestinations destinations={featuredDestinations} isLoading={isLoading} />
      <UniqueExperiences tours={featuredTours} isLoading={isLoading} />
      <AIShowcase />
      <Footer />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </main>
  );
};

export default Index;
