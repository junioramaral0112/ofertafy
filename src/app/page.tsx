"use client";

import { useState } from "react";
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
import { MobileSearchBar } from "@/components/mobile/MobileSearchBar";

export default function Home() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-900 dark:text-white selection:bg-brand-purple/20 transition-colors">
      <Navbar />
      <MobileSearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        onSearch={() => {}}
      />
      <Hero />
      <Partners />
      <HowItWorks />
      <AIFeature />
      <FeaturedOffers searchTerm={searchTerm} />
      <Benefits />
      <Stats />
      <Testimonials />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  );
}
