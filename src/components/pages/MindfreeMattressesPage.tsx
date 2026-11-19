import React, { useState, useMemo, useEffect } from 'react';
import { ShoppingCart, Ruler, SlidersHorizontal, ChevronRight } from 'lucide-react';
import {
  BED_PRICE_CATALOGUE_PRODUCTS,
  STANDARD_CATALOGUE_SIZES,
  formatIndianRupeeExact,
  getCatalogueVariantPrice,
  type CatalogueCategoryId,
  type CatalogueMattressProduct,
} from '../../data/bedPriceCatalogueData';
import { useNavigation } from '../../context/NavigationContext';
import { useHomePageContent } from '../../context/HomePageContentContext';
import { ScrollReveal } from '../motion/ScrollReveal';
import { fetchProductsFromPg, type PgProductRecord } from '../../services/postgresApi';

type MattressSectionFilterId =
  | 'all'
  | 'foam'
  | 'spring'
  | 'orthopedic'
  | 'latex'
  | 'cooling'
  | 'normal-bed'
  | 'pillow-top'
  | 'euro-top';

interface SectionMeta {
  id: MattressSectionFilterId;
  eyebrow: string;
  title: string;
  description: string;
}

const SECTION_META_MAP: Record<MattressSectionFilterId, SectionMeta> = {
  all: {
    id: 'all',
    eyebrow: 'MINDFREE MATTRESS COLLECTION',
    title: 'All Handcrafted Mattresses',
    description:
      'Complete Mindfree mattress collection across Foam, Spring, Orthopedic, Natural Latex, and Active Cooling series.',
  },
  foam: {
    id: 'foam',
    eyebrow: 'FOAM & MEMORY FOAM SERIES',
    title: 'Foam Mattresses',
    description:
      'Multi-density PU, E-Foam, High-Resilience (HR), and Visco Memory Foam mattresses crafted for adaptive body-contouring support.',
  },
  spring: {
    id: 'spring',
    eyebrow: 'BONNELL & POCKET COIL SERIES',
    title: 'Spring Mattresses',
    description:
      'Tempered steel Bonnell coils and CoreFlex individual pocket springs in Tight-Top, Euro-Top, and 7-star Hotel Pillow-Top profiles.',
  },
  orthopedic: {
    id: 'orthopedic',
    eyebrow: 'CLINICAL SPINE & LUMBAR SERIES',
    title: 'Orthopedic & Back Support Mattresses',
    description:
      'High-density rebonded foam, natural coir, and 5-zone postural support cores engineered for targeted lumbar and spinal alignment.',
  },
  latex: {
    id: 'latex',
    eyebrow: 'BOTANICAL ECO-LATEX SERIES',
    title: 'Latex & Hybrid Mattresses',
    description:
      '100% pin-core natural latex paired with orthopedic memory foam or pocket springs for buoyant, breathable sleep.',
  },
  cooling: {
    id: 'cooling',
    eyebrow: 'THERMOREGULATING SLEEP SERIES',
    title: 'Luxury Cooling & Comfort Mattresses',
    description:
      'Mattresses featuring Active Cool Gel Foam, phase-change cooling treatment, and breathable Aero-Tex fabrics.',
  },
  'normal-bed': {
    id: 'normal-bed',
    eyebrow: 'BY TOP DESIGN • CLASSIC TIGHT-TOP',
    title: 'Normal Bed (Tight-Top Mattresses)',
    description:
      'Tailored tight-top construction offering clean edges, balanced everyday firmness, and long-lasting structural support.',
  },
  'pillow-top': {
    id: 'pillow-top',
    eyebrow: 'BY TOP DESIGN • PLUSH PILLOW-TOP',
    title: 'Pillow Top Mattresses',
    description:
      'Extra-soft cloud-quilted cushioning crown stitched atop the support core for luxurious 7-star hotel pressure relief.',
  },
  'euro-top': {
    id: 'euro-top',
    eyebrow: 'BY TOP DESIGN • FLUSH EURO / BOX TOP',
    title: 'Euro Top & Box Top Mattresses',
    description:
      'Flush-edge plush comfort layer integrated seamlessly into the mattress perimeter for premium contouring and edge stability.',
  },
};

function normalizeSectionFilter(raw: string | null | undefined): MattressSectionFilterId {
  if (!raw || raw === 'all') return 'all';
  const clean = raw.toLowerCase().trim();
  if (clean === 'foam' || clean === 'memory-foam' || clean === 'ep-foam') return 'foam';
  if (clean === 'spring') return 'spring';
  if (clean === 'orthopedic' || clean === 'coir' || clean === 'rebound-foam') return 'orthopedic';
  if (clean === 'latex' || clean === 'hybrid') return 'latex';
  if (clean === 'cooling') return 'cooling';
  if (clean === 'normal-bed' || clean === 'tight-top') return 'normal-bed';
  if (clean === 'pillow-top') return 'pillow-top';
  if (clean === 'euro-top' || clean === 'box-top') return 'euro-top';
  return 'all';
}

export const MindfreeMattressesPage: React.FC = () => {
  const { categoryFilter, navigateToProduct, navigateToMattresses } = useNavigation();
  const { mattressesData } = useHomePageContent();

  const [activeSection, setActiveSection] = useState<MattressSectionFilterId>(() =>
    normalizeSectionFilter(categoryFilter)
  );
  const [selectedSizeKey, setSelectedSizeKey] = useState<string>('72x30');
  const [pgCustomProducts, setPgCustomProducts] = useState<PgProductRecord[]>([]);

  useEffect(() => {
    setActiveSection(normalizeSectionFilter(categoryFilter));
  }, [categoryFilter]);

  useEffect(() => {
    fetchProductsFromPg().then((rows) => {
      if (rows && rows.length > 0) setPgCustomProducts(rows);
    });
  }, []);

  const cmsModels =
    mattressesData.mattressModels.length > 0
      ? mattressesData.mattressModels
      : BED_PRICE_CATALOGUE_PRODUCTS;

  const allCatalogueProducts = useMemo<CatalogueMattressProduct[]>(() => {
    const existingIds = new Set(cmsModels.map((p) => p.id));
    const baseTemplate = cmsModels[0] || BED_PRICE_CATALOGUE_PRODUCTS[0];
    const extras: CatalogueMattressProduct[] = pgCustomProducts
      .filter((r) => !existingIds.has(r.id))
      .map((r) => ({
        ...baseTemplate,
        id: r.id,
        slug: r.slug,
        name: r.name,
        tagline: r.tagline || 'Handcrafted Mindfree Sleep System',
        categories: (r.categories?.length ? r.categories : ['orthopedic']) as CatalogueCategoryId[],
        topFinishStyle: (r.top_finish_style ||
          'Euro / Box Top') as CatalogueMattressProduct['topFinishStyle'],
        warrantyMonths: Number(r.warranty_months) || 60,
        warrantyYears: Math.round((Number(r.warranty_months) || 60) / 12),
        startingPrice: Number(r.starting_price) || 14999,
        thicknessOptions: r.thickness_options?.length ? r.thickness_options : [6, 8],
        images: {
          ...baseTemplate.images,
          hero: r.hero_image || '/images/products/product-deluxe.jpg',
          coolingHero: r.cooling_image || undefined,
        },
        priceMatrix: [],
      }));
    return [...cmsModels, ...extras];
  }, [cmsModels, pgCustomProducts]);

  const activeDimension = useMemo(() => {
    const [l, w] = selectedSizeKey.split('x').map(Number);
    return (
      STANDARD_CATALOGUE_SIZES.find((s) => s.lengthInches === l && s.widthInches === w) ||
      STANDARD_CATALOGUE_SIZES[0]
    );
  }, [selectedSizeKey]);

  const getCardVariant = (product: CatalogueMattressProduct) => {
    if (selectedSizeKey === '72x30') {
      return {
        ...(product.priceMatrix[0] || {
          sizeFeet: '6 x 2.5',
          sizeInches: '72 x 30',
          lengthInches: 72,
          widthInches: 30,
          thicknessInches: product.thicknessOptions[0] || 6,
          verified: true,
        }),
        mrp: product.startingPrice,
      };
    }
    const defaultThickness = product.thicknessOptions[0];
    return (
      getCatalogueVariantPrice(
        product,
        activeDimension.lengthInches,
        activeDimension.widthInches,
        defaultThickness
      ) || product.priceMatrix[0]
    );
  };

  const getProductsForSection = (sectionId: MattressSectionFilterId): CatalogueMattressProduct[] => {
    if (sectionId === 'all') return allCatalogueProducts;
    if (
      sectionId === 'foam' ||
      sectionId === 'spring' ||
      sectionId === 'orthopedic' ||
      sectionId === 'latex' ||
      sectionId === 'cooling'
    ) {
      return allCatalogueProducts.filter((p) => p.categories.includes(sectionId));
    }
    if (sectionId === 'normal-bed') {
      return allCatalogueProducts.filter(
        (p) =>
          p.topFinishStyle === 'Normal / Tight Top' ||
          p.topFinishStyle.toLowerCase().includes('tight') ||
          p.topFinishStyle === 'Dual-Side Reversible'
      );
    }
    if (sectionId === 'pillow-top') {
      return allCatalogueProducts.filter((p) =>
        p.topFinishStyle.toLowerCase().includes('pillow')
      );
    }
    if (sectionId === 'euro-top') {
      return allCatalogueProducts.filter(
        (p) =>
          p.topFinishStyle === 'Euro / Box Top' ||
          p.topFinishStyle.toLowerCase().includes('euro') ||
          p.topFinishStyle.toLowerCase().includes('box')
      );
    }
    return allCatalogueProducts;
  };

  // Filter ONLY the selected section's products
  const sectionProducts = useMemo<CatalogueMattressProduct[]>(
    () => getProductsForSection(activeSection),
    [allCatalogueProducts, activeSection]
  );

  const sectionMeta = useMemo<SectionMeta>(() => {
    const base = SECTION_META_MAP[activeSection] || SECTION_META_MAP.all;
    const catMatch = mattressesData.catalogueCategories.find((c) => c.id === activeSection);
    if (catMatch) {
      return {
        ...base,
        title: catMatch.label || base.title,
        description: catMatch.description || base.description,
      };
    }
    const topMatch = mattressesData.megaMenu.topDesignsItems.find((t) => t.id === activeSection);
    if (topMatch) {
      return {
        ...base,
        title: topMatch.name || base.title,
        description: topMatch.description || base.description,
      };
    }
    return base;
  }, [activeSection, mattressesData.catalogueCategories, mattressesData.megaMenu.topDesignsItems]);

  const categoryFilterItems = useMemo<{ id: MattressSectionFilterId; label: string }[]>(() => {
    const getCatLabel = (id: string, fallback: string) =>
      mattressesData.catalogueCategories.find((c) => c.id === id)?.shortLabel ||
      mattressesData.catalogueCategories.find((c) => c.id === id)?.label ||
      fallback;
    return [
      { id: 'foam', label: getCatLabel('foam', 'Foam Mattresses') },
      { id: 'spring', label: getCatLabel('spring', 'Spring Mattresses') },
      { id: 'orthopedic', label: getCatLabel('orthopedic', 'Orthopedic & Spine') },
      { id: 'latex', label: getCatLabel('latex', 'Latex & Hybrid') },
      { id: 'cooling', label: getCatLabel('cooling', 'Cooling Mattresses') },
      { id: 'all', label: getCatLabel('all', 'All Mattresses') },
    ];
  }, [mattressesData.catalogueCategories]);

  const topDesignFilterItems = useMemo<{ id: MattressSectionFilterId; label: string }[]>(() => {
    const getTopLabel = (id: string, fallback: string) =>
      mattressesData.megaMenu.topDesignsItems.find((t) => t.id === id)?.name || fallback;
    return [
      { id: 'normal-bed', label: getTopLabel('normal-bed', 'Normal Bed (Tight-Top)') },
      { id: 'pillow-top', label: getTopLabel('pillow-top', 'Pillow Top') },
      { id: 'euro-top', label: getTopLabel('euro-top', 'Euro / Box Top') },
    ];
  }, [mattressesData.megaMenu.topDesignsItems]);

  const handleSelectSection = (id: MattressSectionFilterId) => {
    setActiveSection(id);
    navigateToMattresses(id);
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen font-dm text-[#0A2540] py-8 sm:py-12">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row items-start gap-7 lg:gap-8">
          {/* =============================================================== */}
          {/* LEFT SIDEBAR FILTER                                             */}
          {/* =============================================================== */}
          <aside className="w-full lg:w-[270px] xl:w-[290px] shrink-0 lg:sticky lg:top-28 bg-white rounded-[22px] border border-[#E2E8F0] p-5 shadow-[0_6px_24px_rgba(10,37,64,0.04)] space-y-6">
            {/* Filter Header */}
            <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3.5">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#0A2E73]" />
                <h2 className="text-[15px] font-bold text-[#0A2E73] tracking-tight">
                  Mattress Filters
                </h2>
              </div>
              {activeSection !== 'all' && (
                <button
                  type="button"
                  onClick={() => handleSelectSection('all')}
                  className="text-[11.5px] font-semibold text-[#E3262E] hover:underline cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>

            {/* 1. Size Selector inside Left Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[#64748B]">
                <Ruler className="w-3.5 h-3.5 text-[#E3262E]" />
                <span>Select Bed Size</span>
              </label>
              <div className="bg-[#F8FAFC] px-3.5 py-2.5 rounded-xl border border-[#E2E8F0]">
                <select
                  aria-label="Select Mattress Size"
                  value={selectedSizeKey}
                  onChange={(e) => setSelectedSizeKey(e.target.value)}
                  className="w-full bg-transparent text-[13px] font-semibold text-[#0A2E73] focus:outline-none cursor-pointer"
                >
                  {STANDARD_CATALOGUE_SIZES.map((sz) => (
                    <option key={sz.sizeInches} value={`${sz.lengthInches}x${sz.widthInches}`}>
                      {sz.sizeInches}" ({sz.sizeFeet} ft — {sz.sizeGroup})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Shop by Mattress Category */}
            <div className="space-y-2">
              <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#64748B]">
                Shop by Category
              </span>
              <div className="flex flex-col space-y-1.5">
                {categoryFilterItems.map((item) => {
                  const active = activeSection === item.id;
                  const count = getProductsForSection(item.id).length;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSection(item.id)}
                      className={`w-full min-h-[42px] px-3.5 py-2 rounded-xl text-left text-[13px] font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-[#0A2E73] text-white shadow-[0_6px_16px_rgba(10,46,115,0.2)]'
                          : 'bg-[#F8FAFC] text-[#334155] border border-transparent hover:border-[#0A2E73]/30 hover:bg-[#EFF6FF]/60 hover:text-[#0A2E73]'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. Filter by Top Design */}
            <div className="space-y-2 pt-2 border-t border-[#E2E8F0]">
              <span className="block text-[11px] font-bold uppercase tracking-[0.06em] text-[#64748B]">
                By Top Design
              </span>
              <div className="flex flex-col space-y-1.5">
                {topDesignFilterItems.map((item) => {
                  const active = activeSection === item.id;
                  const count = getProductsForSection(item.id).length;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSection(item.id)}
                      className={`w-full min-h-[40px] px-3.5 py-2 rounded-xl text-left text-[12.5px] font-semibold flex items-center justify-between transition-all duration-200 cursor-pointer ${
                        active
                          ? 'bg-[#0A2E73] text-white shadow-[0_6px_16px_rgba(10,46,115,0.2)]'
                          : 'bg-[#F8FAFC] text-[#334155] border border-transparent hover:border-[#0A2E73]/30 hover:bg-[#EFF6FF]/60 hover:text-[#0A2E73]'
                      }`}
                    >
                      <span className="flex items-center gap-1.5 truncate">
                        <ChevronRight
                          className={`w-3.5 h-3.5 shrink-0 ${
                            active ? 'text-white' : 'text-[#94A3B8]'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </span>
                      <span
                        className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                          active
                            ? 'bg-white/20 text-white'
                            : 'bg-white text-[#64748B] border border-[#E2E8F0]'
                        }`}
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* =============================================================== */}
          {/* RIGHT CONTENT: SECTION HEADER + 3x3 CARDS GRID                  */}
          {/* =============================================================== */}
          <div className="flex-1 min-w-0 w-full space-y-7">
            {/* Active Section Header */}
            <ScrollReveal variant="fade-up">
              <div className="bg-white rounded-[22px] border border-[#E2E8F0] p-5 sm:p-6 shadow-[0_4px_14px_rgba(10,37,64,0.03)]">
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0F62C8] block">
                  {sectionMeta.eyebrow}
                </span>
                <div className="flex flex-wrap items-center gap-3 mt-1">
                  <h1 className="text-2xl sm:text-3xl font-semibold text-[#0A2E73] leading-[1.3]">
                    {sectionMeta.title}
                  </h1>
                  <span className="px-3 py-1 rounded-full bg-[#0A2E73]/10 text-[#0A2E73] text-xs font-bold">
                    {sectionProducts.length}{' '}
                    {sectionProducts.length === 1 ? 'Mattress' : 'Mattresses'}
                  </span>
                </div>
                <p className="text-[13.5px] sm:text-[14px] text-[#475569] mt-1.5 max-w-3xl">
                  {sectionMeta.description}
                </p>
              </div>
            </ScrollReveal>

            {/* 3x3 Cards Grid Style (3 Columns on Desktop) — Only the Selected Section's Products */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {sectionProducts.map((product, idx) => {
                const activeVariant = getCardVariant(product);
                const mrp = activeVariant ? activeVariant.mrp : product.startingPrice;
                const compareAtPrice = Math.round(mrp * 1.12);
                const imageSrc =
                  activeSection === 'cooling' && product.images.coolingHero
                    ? product.images.coolingHero
                    : product.images.hero;

                return (
                  <ScrollReveal
                    key={`${activeSection}-${product.id}`}
                    variant="fade-up"
                    delay={idx * 60}
                  >
                    <article className="h-full bg-white/95 backdrop-blur-md rounded-[18px] border border-[#E2E8F0] hover:border-[#0A2E73]/30 overflow-hidden shadow-[0_4px_14px_rgba(10,37,64,0.04)] hover:shadow-[0_20px_42px_rgba(10,46,115,0.12)] sm:hover:-translate-y-1.5 transition-all duration-300 flex flex-col group font-dm">
                      {/* Product Image with Glassmorphic Top-Left Pill Badge */}
                      <div
                        onClick={() => navigateToProduct(product.slug)}
                        className="relative w-full aspect-[4/3] shrink-0 bg-white overflow-hidden cursor-pointer flex items-center justify-center p-1.5"
                      >
                        <img
                          src={imageSrc}
                          alt={product.name}
                          className="max-w-full max-h-full w-auto h-auto object-contain"
                        />

                        {/* Subtle Luxury Gradient Vignette on Hover */}
                        <div className="absolute inset-0 bg-gradient-to-t from-[#071F52]/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

                        {/* Single Glassmorphic Top-Left Badge */}
                        <span className="absolute top-3.5 left-3.5 px-3 py-1 rounded-full bg-[#0A2E73]/90 backdrop-blur-md border border-white/15 text-white text-[11px] font-semibold tracking-[0.02em] shadow-[0_4px_12px_rgba(10,46,115,0.25)]">
                          {product.warrantyMonths}M Warranty
                        </span>
                      </div>

                      {/* Card Body */}
                      <div className="p-5 flex-1 min-w-0 flex flex-col justify-between space-y-4">
                        <h3
                          onClick={() => navigateToProduct(product.slug)}
                          className="text-[15.5px] sm:text-[16.5px] font-semibold text-[#222222] group-hover:text-[#0A2E73] leading-[1.4] line-clamp-2 cursor-pointer transition-colors"
                        >
                          {product.name} — {product.tagline} ({product.topFinishStyle})
                        </h3>

                        <div className="space-y-3.5">
                          {/* Price Row */}
                          <div className="flex items-baseline flex-wrap gap-2.5">
                            <span className="text-[19px] sm:text-[21px] font-bold text-[#0A2E73]">
                              {formatIndianRupeeExact(mrp)}
                            </span>
                            <span className="text-[12.5px] font-normal text-[#999999] line-through">
                              {formatIndianRupeeExact(compareAtPrice)}
                            </span>
                          </div>

                          {/* Full-Width Thumb-Friendly Pill CTA Button */}
                          <button
                            type="button"
                            onClick={() => navigateToProduct(product.slug)}
                            className="relative overflow-hidden w-full min-h-[48px] py-3 px-5 rounded-full bg-[#0A2E73] hover:bg-[#0E3B91] active:scale-[0.98] text-white text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-[0_6px_16px_rgba(10,46,115,0.18)] hover:shadow-[0_10px_24px_rgba(10,46,115,0.28)]"
                          >
                            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform pointer-events-none" />
                            <ShoppingCart className="w-4 h-4 stroke-[2] relative z-10" />
                            <span className="relative z-10">Buy Now</span>
                          </button>
                        </div>
                      </div>
                    </article>
                  </ScrollReveal>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
