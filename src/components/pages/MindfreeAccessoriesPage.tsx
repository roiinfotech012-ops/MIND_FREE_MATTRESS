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
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { ACCESSORIES_CATALOGUE, type AccessoryItem } from '../../data/accessoriesData';

export const MindfreeAccessoriesPage: React.FC = () => {
  const { navigateToMattresses } = useNavigation();
  const { addToCart, wishlist, toggleWishlist } = useCart();

  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({
    'bamboo-protector': 'queen',
    'cotton-sheet-set': 'queen',
    'mulberry-silk-pillowcase': 'standard-pair',
    'botanical-micro-duvet': 'queen',
  });

  const handleSelectVariant = (productId: string, variantId: string) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variantId,
    }));
  };

  const handleAddToCart = (item: AccessoryItem) => {
    const variantId = selectedVariants[item.id] || item.sizes[0].id;
    const variant = item.sizes.find((s) => s.id === variantId) || item.sizes[0];

    addToCart(
      {
        id: item.id,
        sku: variant.sku,
        name: `${item.name} (${variant.label})`,
        size: variant.label,
        thickness: 'Atelier Bedding Spec',
        price: variant.price,
        originalPrice: item.originalPrice,
        image: item.image,
      },
      1
    );
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* 1. EDITORIAL HERO BANNER */}
      <section className="relative bg-[#0A2E73] text-[#F8FAFC] pt-14 pb-16 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 bg-radial from-[#1244A8] via-[#0A2E73] to-[#071F52] opacity-90 pointer-events-none" />
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-[#E3262E]/10 blur-3xl pointer-events-none" />

        <div className="relative max-w-[1520px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-mono tracking-widest uppercase text-[#E3262E]">
              <Sparkles className="w-3.5 h-3.5 text-[#E3262E]" />
              <span>Luxury Bedding Sanctuary</span>
            </div>
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal tracking-tight text-white leading-tight">
              Tactile Indulgence,{' '}
              <span className="italic font-light text-[#E3262E]">Natural Botanical Purity.</span>
            </h1>
            <p className="text-white/80 text-sm sm:text-base leading-relaxed font-sans">
              Complete your bespoke sleep sanctuary with mindful essentials. From breathable bamboo
              waterproof protectors and 400TC organic satin cotton to 22-Momme pure mulberry silk and
              temperature-regulating duvets.
            </p>
          </div>

          <div className="shrink-0 bg-white/5 border border-white/15 rounded-3xl p-5 backdrop-blur-md max-w-sm w-full space-y-2">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-[#E3262E]" />
              <h4 className="text-sm font-serif font-bold text-white">GOTS & OEKO-TEX Certified</h4>
            </div>
            <p className="text-xs text-white/70 leading-relaxed">
              Every textile touching your skin is 100% free of harmful formaldehyde, chemical softening
              agents, and synthetic microplastics.
            </p>
          </div>
        </div>
      </section>

      {/* 2. REASSURANCE STRIP */}
      <section className="bg-white border-b border-[#E2E8F0] py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1520px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#0F2952]">
            <Truck className="w-4 h-4 text-[#E3262E] shrink-0" />
            <span>Free Express Doorstep Delivery</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#0F2952]">
            <ShieldCheck className="w-4 h-4 text-[#E3262E] shrink-0" />
            <span>Guaranteed Non-Pilling Fibers</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#0F2952]">
            <RotateCcw className="w-4 h-4 text-[#E3262E] shrink-0" />
            <span>Hassle-Free Exchange Policy</span>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs font-medium text-[#0F2952]">
            <Award className="w-4 h-4 text-[#E3262E] shrink-0" />
            <span>100% Zero-Harm Chemical Weave</span>
          </div>
        </div>
      </section>

      {/* 3. ACCESSORIES PRODUCT GRID */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#E2E8F0] pb-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-[#E3262E] font-bold">
              The Sanctuary Collection
            </span>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#071F52] mt-1">
              Curated Bedding & Care Essentials
            </h2>
          </div>
          <p className="text-xs text-[#64748B]">
            Engineered to safeguard your mattress and elevate sleep comfort.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {ACCESSORIES_CATALOGUE.map((item) => {
            const selectedVariantId = selectedVariants[item.id] || item.sizes[0].id;
            const currentVariant =
              item.sizes.find((s) => s.id === selectedVariantId) || item.sizes[0];
            const isSaved = wishlist.includes(item.id);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#E3262E]/50 shadow-xs hover:shadow-[0_16px_40px_rgba(10,46,115,0.08)] transition-all duration-300 flex flex-col sm:flex-row overflow-hidden group"
              >
                {/* Image */}
                <div className="relative sm:w-2/5 min-h-[220px] sm:min-h-full bg-white overflow-hidden shrink-0 flex items-center justify-center p-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/images/type_ortho.png';
                    }}
                  />
                  {item.badge && (
                    <div className="absolute top-3 left-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-[#0A2E73] text-[#F8FAFC] text-[9.5px] font-bold uppercase tracking-wider">
                        {item.badge}
                      </span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(item.id)}
                    className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center backdrop-blur-md transition-all cursor-pointer ${
                      isSaved
                        ? 'bg-rose-50 text-rose-600 shadow-md'
                        : 'bg-white/80 hover:bg-white text-[#0F2952]'
                    }`}
                    aria-label="Save to Wishlist"
                  >
                    <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-rose-600' : ''}`} />
                  </button>
                </div>

                {/* Details */}
                <div className="p-6 sm:w-3/5 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                      <span className="text-xs font-bold text-[#0F2952]">{item.rating}</span>
                      <span className="text-[11px] text-[#64748B]">
                        ({item.reviewsCount} reviews)
                      </span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-[#071F52] leading-snug">
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#64748B] leading-relaxed">{item.tagline}</p>

                    <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Material:</span>
                        <span className="font-medium text-[#0A2E73] truncate max-w-[180px]">
                          {item.material}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748B]">Dimensions:</span>
                        <span className="font-medium text-[#0F2952]">{item.dimensions}</span>
                      </div>
                    </div>

                    <ul className="space-y-1 pt-1">
                      {item.keyFeatures.slice(0, 2).map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-1.5 text-[11px] text-[#0F2952]">
                          <Check className="w-3.5 h-3.5 text-[#E3262E] shrink-0 mt-0.5" />
                          <span className="line-clamp-1">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Size options & CTA */}
                  <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {item.sizes.map((sz) => (
                        <button
                          key={sz.id}
                          type="button"
                          onClick={() => handleSelectVariant(item.id, sz.id)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                            sz.id === selectedVariantId
                              ? 'bg-[#0A2E73] text-white shadow-2xs font-semibold'
                              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                          }`}
                        >
                          {sz.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl font-serif font-bold text-[#0A2E73]">
                            ₹{currentVariant.price.toLocaleString('en-IN')}
                          </span>
                          <span className="text-xs text-[#64748B] line-through">
                            ₹{item.originalPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        className="py-2 px-4 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-xs"
                      >
                        Add to Bag
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. BEDCARE ATELIER PHILOSOPHY */}
      <section className="bg-white border-t border-[#E2E8F0] py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1520px] mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl">
            <span className="text-xs font-mono uppercase tracking-widest text-[#E3262E] font-bold">
              The Bedcare Philosophy
            </span>
            <h3 className="font-serif text-2xl font-bold text-[#071F52]">
              Why Mattress Protection Extends Sleep Quality by 10 Years
            </h3>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Every night, the human body releases naturally occurring moisture and dead skin cells.
              Without a breathable, non-toxic barrier, moisture penetrates the internal foam cell
              matrix, degrading tensile elasticity. Our bamboo protector preserves your 10-year
              warranty without sacrificing airflow.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigateToMattresses()}
            className="shrink-0 px-6 py-3 rounded-2xl bg-[#0A2E73] text-[#F8FAFC] hover:bg-[#071F52] text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer"
          >
            Pair with a Signature Mattress →
          </button>
        </div>
      </section>
    </div>
  );
};
