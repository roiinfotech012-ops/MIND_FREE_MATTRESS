import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Check,
  Star,
  Heart,
  Truck,
  RotateCcw,
  Award,
  ChevronRight,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useHomePageContent } from '../../context/HomePageContentContext';
import { PILLOWS_CATALOGUE, type AccessoryItem } from '../../data/accessoriesData';
import { ScrollReveal } from '../motion/ScrollReveal';

export const MindfreePillowsPage: React.FC = () => {
  const { navigateToSleepGuide } = useNavigation();
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const { pillowsData } = useHomePageContent();
  const pillowsList =
    pillowsData.pillowModels.length > 0 ? pillowsData.pillowModels : PILLOWS_CATALOGUE;

  // Selected sizes for each pillow product
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'cervical-memory-foam': 'standard',
    'organic-latex-pillow': 'standard',
    'cooling-gel-pillow': 'standard',
    'microfiber-hotel-pillow': 'standard-pair',
  });

  const handleSelectVariant = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  };

  const handleAddPillowToCart = (pillow: AccessoryItem) => {
    const variantId = selectedVariants[pillow.id] || pillow.sizes[0].id;
    const variant = pillow.sizes.find((s) => s.id === variantId) || pillow.sizes[0];

    addToCart(
      {
        id: pillow.id,
        sku: variant.sku,
        name: `${pillow.name} (${variant.label})`,
        size: variant.label,
        thickness: pillow.firmnessOrLoft || 'Standard Loft',
        price: variant.price,
        originalPrice: pillow.originalPrice,
        image: pillow.image,
      },
      1
    );
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* 1. EDITORIAL HERO BANNER */}
      <section className="relative bg-[#0A2E73] text-[#F8FAFC] pt-8 pb-9 sm:pt-14 sm:pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-radial from-[#1244A8] via-[#0A2E73] to-[#071F52] opacity-90 pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 rounded-full bg-[#E3262E]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-[1520px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-5 sm:gap-8">
          <div className="max-w-2xl space-y-2.5 sm:space-y-4">
            <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] sm:text-[11px] font-semibold tracking-wider uppercase text-white">
              <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white" />
              <span>{pillowsData.heroBanner.badge}</span>
            </div>
            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
              {pillowsData.heroBanner.headlineMain}{' '}
              <span className="font-bold text-white">
                {pillowsData.heroBanner.headlineHighlight}
              </span>
            </h1>
            <p className="text-white/80 text-xs sm:text-base leading-relaxed font-sans">
              {pillowsData.heroBanner.description}
            </p>
          </div>

          <div className="shrink-0 bg-white/5 border border-white/15 rounded-2xl sm:rounded-3xl p-4 sm:p-5 backdrop-blur-md max-w-sm w-full">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-1.5 sm:mb-2">
              <Award className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              <h4 className="text-xs sm:text-sm font-serif font-bold text-white">
                {pillowsData.heroBanner.promiseTitle}
              </h4>
            </div>
            <p className="text-[11px] sm:text-xs text-white/70 leading-relaxed">
              {pillowsData.heroBanner.promiseText}
            </p>
            <button
              type="button"
              onClick={() => navigateToSleepGuide('spine-alignment-posture-science')}
              className="mt-2.5 sm:mt-3 text-[11px] sm:text-xs font-semibold text-white hover:text-white/80 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>{pillowsData.heroBanner.promiseLinkText}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* 2. REASSURANCE STRIP */}
      <section className="bg-white border-b border-[#E2E8F0] py-3.5 sm:py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1520px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4 text-left sm:text-center">
          <div className="flex items-center sm:justify-center gap-2 text-[11px] sm:text-xs font-medium text-[#0F2952]">
            <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3262E] shrink-0" />
            <span className="leading-tight">{pillowsData.reassuranceItems[0]}</span>
          </div>
          <div className="flex items-center sm:justify-center gap-2 text-[11px] sm:text-xs font-medium text-[#0F2952]">
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3262E] shrink-0" />
            <span className="leading-tight">{pillowsData.reassuranceItems[1]}</span>
          </div>
          <div className="flex items-center sm:justify-center gap-2 text-[11px] sm:text-xs font-medium text-[#0F2952]">
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3262E] shrink-0" />
            <span className="leading-tight">{pillowsData.reassuranceItems[2]}</span>
          </div>
          <div className="flex items-center sm:justify-center gap-2 text-[11px] sm:text-xs font-medium text-[#0F2952]">
            <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#E3262E] shrink-0" />
            <span className="leading-tight">{pillowsData.reassuranceItems[3]}</span>
          </div>
        </div>
      </section>

      {/* 3. PRODUCT CATALOGUE SECTION */}
      <section className="max-w-[1520px] mx-auto px-3.5 sm:px-6 lg:px-8 py-7 sm:py-12 space-y-5 sm:space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 sm:gap-4 border-b border-[#E2E8F0] pb-3.5 sm:pb-4">
          <div>
            <span className="text-[10px] sm:text-xs font-mono uppercase tracking-widest text-[#E3262E] font-bold">
              {pillowsData.catalogueHeader.eyebrow}
            </span>
            <h2 className="font-serif text-xl sm:text-3xl font-bold text-[#071F52] mt-0.5 sm:mt-1">
              {pillowsData.catalogueHeader.title}
            </h2>
          </div>
          <p className="text-[11px] sm:text-xs text-[#64748B]">
            {pillowsData.catalogueHeader.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
          {pillowsList.map((pillow, idx) => {
            const selectedVariantId = selectedVariants[pillow.id] || pillow.sizes[0].id;
            const currentVariant =
              pillow.sizes.find((s) => s.id === selectedVariantId) || pillow.sizes[0];
            const isSaved = wishlist.includes(pillow.id);

            return (
              <ScrollReveal key={pillow.id} variant="fade-up" delay={idx * 90}>
                <div
                  className="bg-white/95 backdrop-blur-md rounded-2xl sm:rounded-3xl border border-[#E2E8F0] hover:border-[#E3262E]/50 shadow-[0_4px_14px_rgba(10,37,64,0.04)] hover:shadow-[0_20px_44px_rgba(10,46,115,0.12)] sm:hover:-translate-y-1.5 transition-all duration-300 flex flex-row overflow-hidden group h-full"
                >
                {/* Left Image */}
                <div className="relative w-[42%] sm:w-2/5 bg-white overflow-hidden shrink-0 flex items-center justify-center p-2">
                  <img
                    src={pillow.image}
                    alt={pillow.name}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/type_ortho.png';
                    }}
                  />
                  {pillow.badge && (
                    <div className="absolute top-2 left-2 sm:top-3 sm:left-3 max-w-[calc(100%-16px)]">
                      <span className="block truncate px-2 sm:px-2.5 py-0.5 rounded-full bg-[#0A2E73] text-[#F8FAFC] text-[8px] sm:text-[9.5px] font-bold uppercase tracking-wider shadow-xs">
                        {pillow.badge}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(pillow.id)}
                    className={`absolute bottom-2 right-2 sm:bottom-auto sm:top-3 sm:right-3 w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer shadow-xs ${
                      isSaved
                        ? 'bg-rose-50 text-rose-600 shadow-md'
                        : 'bg-white/85 hover:bg-white text-[#0F2952]'
                    }`}
                    aria-label="Save to Wishlist"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600' : ''}`} />
                  </button>
                </div>

                {/* Right Details */}
                <div className="p-3 sm:p-6 w-[58%] sm:w-3/5 min-w-0 flex flex-col justify-between gap-2.5 sm:gap-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex items-center gap-1 sm:gap-1.5">
                      <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                      <span className="text-[11px] sm:text-xs font-bold text-[#0F2952]">{pillow.rating}</span>
                      <span className="text-[10px] sm:text-[11px] text-[#64748B] truncate">
                        ({pillow.reviewsCount} reviews)
                      </span>
                    </div>

                    <h3 className="font-serif text-[13.5px] sm:text-lg font-bold text-[#071F52] leading-snug line-clamp-2">
                      {pillow.name}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#64748B] leading-snug sm:leading-relaxed line-clamp-2">
                      {pillow.tagline}
                    </p>

                    {/* Compact Mobile Loft Tag */}
                    <div className="sm:hidden pt-0.5">
                      <span className="inline-block bg-[#F1F5F9] text-[#0A2E73] text-[10px] font-semibold px-2 py-0.5 rounded-md border border-[#E2E8F0]">
                        {pillow.firmnessOrLoft}
                      </span>
                    </div>

                    {/* Desktop Feel & Dimensions */}
                    <div className="hidden sm:block bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Feel / Loft:</span>
                        <span className="font-semibold text-[#0A2E73]">{pillow.firmnessOrLoft}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Core Spec:</span>
                        <span className="font-medium text-[#0F2952] truncate max-w-[160px]">
                          {pillow.material}
                        </span>
                      </div>
                    </div>

                    {/* Desktop Features list */}
                    <ul className="hidden sm:block space-y-1 pt-1">
                      {pillow.keyFeatures.slice(0, 2).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-[#0F2952]">
                          <Check className="w-3.5 h-3.5 text-[#E3262E] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Size options & CTA */}
                  <div className="pt-2 sm:pt-3 border-t border-[#E2E8F0] space-y-2 sm:space-y-3">
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5">
                      {pillow.sizes.map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => handleSelectVariant(pillow.id, sz.id)}
                          className={`min-h-[40px] sm:min-h-[44px] px-2 sm:px-3.5 py-1.5 rounded-xl text-[11px] sm:text-xs font-medium active:scale-95 transition-all duration-200 cursor-pointer truncate text-center flex items-center justify-center ${
                            sz.id === selectedVariantId
                              ? 'bg-[#0A2E73] text-white shadow-xs font-semibold'
                              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                          }`}
                        >
                          {sz.label.split(' (')[0]}
                          <span className="hidden sm:inline">
                            {sz.label.includes(' (') ? ` (${sz.label.split(' (')[1]}` : ''}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-base sm:text-xl font-serif font-bold text-[#0A2E73]">
                          ₹{currentVariant.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[11px] sm:text-xs text-[#64748B] line-through">
                          ₹{pillow.originalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddPillowToCart(pillow)}
                        className="w-full sm:w-auto min-h-[48px] py-2.5 px-4 sm:px-5 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] active:scale-[0.98] text-white text-xs sm:text-[13px] font-semibold tracking-wide transition-all duration-200 cursor-pointer shadow-[0_6px_16px_rgba(10,46,115,0.18)] flex items-center justify-center"
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </section>

      {/* 4. POSTURE SLEEPER GUIDE */}
      <section className="bg-white border-t border-[#E2E8F0] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1520px] mx-auto space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <span className="text-xs font-mono uppercase tracking-widest text-[#E3262E] font-bold">
              {pillowsData.postureGuide.eyebrow}
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#071F52]">
              {pillowsData.postureGuide.title}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pillowsData.postureGuide.cards.map((card, cIdx) => (
              <div
                key={cIdx}
                className="bg-[#F8FAFC] p-6 rounded-3xl border border-[#E2E8F0] space-y-3"
              >
                <div className="w-10 h-10 rounded-2xl bg-[#0A2E73] text-[#F8FAFC] flex items-center justify-center font-serif font-bold text-sm">
                  {card.number}
                </div>
                <h3 className="font-serif text-base font-bold text-[#071F52]">{card.title}</h3>
                <p className="text-xs text-[#64748B] leading-relaxed">{card.description}</p>
                <div className="pt-2">
                  <span className="text-[11px] font-mono font-semibold text-[#0A2E73]">
                    {card.bestMatch}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={() => navigateToSleepGuide('cervical-spine-pillow-height-guide')}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#0A2E73] text-[#F8FAFC] hover:bg-[#071F52] text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer"
            >
              <span>{pillowsData.postureGuide.ctaText}</span>
              <ChevronRight className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
