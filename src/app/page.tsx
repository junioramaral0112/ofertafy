"use client";

import { Navbar } from "@/components/sections/navbar";
import { Hero } from "@/components/sections/hero";
import { Partners } from "@/components/sections/partners";
import { HowItWorks } from "@/components/sections/how-it-works";
import { AIFeature } from "@/components/sections/ai-feature";
import { FeaturedOffers } from "@/components/sections/featured-offers";
import { Benefits } from "@/components/sections/benefits";
import { Stats } from "@/components/sections/stats";
import { Testimonials } from "@/components/sections/testimonials";
import { FAQ } from "@/components/sections/faq";
import { Newsletter } from "@/components/sections/newsletter";
import { Footer } from "@/components/sections/footer";

export default function Home() {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white selection:bg-brand-purple/20 transition-colors">
      <Navbar />
      <Hero />
      <Partners />
      <HowItWorks />
      <AIFeature />
      <FeaturedOffers />
      <Benefits />
      <Stats />
      <Testimonials />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  );
}
