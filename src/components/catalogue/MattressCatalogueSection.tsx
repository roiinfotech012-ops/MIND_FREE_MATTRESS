import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { ShoppingCart, Ruler, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  BED_PRICE_CATALOGUE_PRODUCTS,
  CATALOGUE_CATEGORIES,
  STANDARD_CATALOGUE_SIZES,
  formatIndianRupeeExact,
  getCatalogueVariantPrice,
  type CatalogueCategoryId,
  type CatalogueMattressProduct,
} from '../../data/bedPriceCatalogueData';
import { useNavigation } from '../../context/NavigationContext';
import { useHomePageContent } from '../../context/HomePageContentContext';
import { MattressQuizBanner } from './MattressQuizBanner';
import { ScrollReveal } from '../motion/ScrollReveal';
import { fetchProductsFromPg, type PgProductRecord } from '../../services/postgresApi';

interface MattressCatalogueSectionProps {
  initialCategory?: string | null;
}

interface CategoryProductRowProps {
  groupId: CatalogueCategoryId;
  products: CatalogueMattressProduct[];
  getCardVariant: (product: CatalogueMattressProduct) => { mrp: number } | undefined;
  onSelectProduct: (slug: string) => void;
}

const CategoryProductRow: React.FC<CategoryProductRowProps> = ({
  groupId,
  products,
  getCardVariant,
  onSelectProduct,
}) => {
  const isSlider = products.length > 4;
  const [startIndex, setStartIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [visibleCols, setVisibleCols] = useState(4);
  const touchStartXRef = useRef<number | null>(null);

  useEffect(() => {
    const updateCols = () => {
      if (window.innerWidth < 640) setVisibleCols(1);
      else if (window.innerWidth < 1024) setVisibleCols(2);
      else setVisibleCols(4);
    };
    updateCols();
    window.addEventListener('resize', updateCols);
    return () => window.removeEventListener('resize', updateCols);
  }, []);

  const maxStartIndex = Math.max(0, products.length - visibleCols);

  const handleNext = useCallback(() => {
    setStartIndex((prev) => (prev >= maxStartIndex ? 0 : prev + 1));
  }, [maxStartIndex]);

  const handlePrev = useCallback(() => {
    setStartIndex((prev) => (prev <= 0 ? maxStartIndex : prev - 1));
  }, [maxStartIndex]);

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartXRef.current === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) handleNext();
      else handlePrev();
    }
    touchStartXRef.current = null;
  };

  // Auto-advance one product after another when a category has > 4 products
  useEffect(() => {
    if (!isSlider || isHovered || maxStartIndex <= 0) return;
    const timer = setInterval(() => {
      handleNext();
    }, 3500);
    return () => clearInterval(timer);
  }, [isSlider, isHovered, maxStartIndex, handleNext]);

  const renderCard = (product: CatalogueMattressProduct) => {
    const activeVariant = getCardVariant(product);
    const mrp = activeVariant ? activeVariant.mrp : product.startingPrice;
    const compareAtPrice = Math.round(mrp * 1.12);
    const imageSrc =
      groupId === 'cooling' && product.images.coolingHero
        ? product.images.coolingHero
        : product.images.hero;

    return (
      <article
        key={`${groupId}-${product.id}`}
        className={`bg-white/95 backdrop-blur-md rounded-[16px] sm:rounded-[18px] border border-[#E2E8F0] hover:border-[#0A2E73]/30 overflow-hidden shadow-[0_4px_14px_rgba(10,37,64,0.04)] hover:shadow-[0_20px_42px_rgba(10,46,115,0.12)] sm:hover:-translate-y-1.5 transition-all duration-300 flex flex-row sm:flex-col group font-dm ${
          isSlider
            ? 'w-full sm:w-[calc((100%-24px)/2)] lg:w-[calc((100%-72px)/4)] shrink-0'
            : ''
        }`}
      >
        {/* Left on Mobile / Top on Tablet & Desktop: Clean Product Image with Glassmorphic Top-Left Pill Badge */}
        <div
          onClick={() => onSelectProduct(product.slug)}
          className="relative w-[42%] sm:w-full min-h-[150px] sm:min-h-0 sm:aspect-[4/3.8] shrink-0 bg-white overflow-hidden cursor-pointer flex items-center justify-center p-1.5"
        >
          <img
            src={imageSrc}
            alt={product.name}
            className="max-w-full max-h-full w-auto h-auto object-contain"
          />

          {/* Subtle Luxury Gradient Vignette on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#071F52]/25 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Single Glassmorphic Top-Left Badge */}
          <span className="absolute top-2.5 left-2.5 sm:top-3.5 sm:left-3.5 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#0A2E73]/90 backdrop-blur-md border border-white/15 text-white text-[9.5px] sm:text-[11px] font-semibold tracking-[0.02em] shadow-[0_4px_12px_rgba(10,46,115,0.25)]">
            {product.warrantyMonths}M Warranty
          </span>
        </div>

        {/* Right on Mobile / Bottom on Tablet & Desktop: Minimal Card Body */}
        <div className="p-3.5 sm:p-5 flex-1 min-w-0 flex flex-col justify-between space-y-2.5 sm:space-y-4">
          <h4
            onClick={() => onSelectProduct(product.slug)}
            className="text-[13.5px] sm:text-[16px] font-semibold sm:font-medium text-[#222222] group-hover:text-[#0A2E73] leading-[1.35] sm:leading-[1.45] line-clamp-2 cursor-pointer transition-colors"
          >
            {product.name} — {product.tagline} ({product.topFinishStyle})
          </h4>

          <div className="space-y-2.5 sm:space-y-3.5">
            {/* Price Row */}
            <div className="flex items-baseline flex-wrap gap-2 sm:gap-3">
              <span className="text-[17px] sm:text-[20px] font-bold text-[#0A2E73]">
                {formatIndianRupeeExact(mrp)}
              </span>
              <span className="text-[11.5px] sm:text-[13px] font-normal text-[#999999] line-through">
                {formatIndianRupeeExact(compareAtPrice)}
              </span>
            </div>

            {/* Full-Width Thumb-Friendly Pill CTA Button (min 48px height) with Sheen Sweep */}
            <button
              type="button"
              onClick={() => onSelectProduct(product.slug)}
              className="relative overflow-hidden w-full min-h-[48px] py-2.5 sm:py-3 px-4 sm:px-5 rounded-full bg-[#0A2E73] hover:bg-[#0E3B91] active:scale-[0.98] text-white text-[13px] sm:text-[14px] font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-[0_6px_16px_rgba(10,46,115,0.18)] hover:shadow-[0_10px_24px_rgba(10,46,115,0.28)]"
            >
              <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent transition-transform pointer-events-none" />
              <ShoppingCart className="w-4 h-4 stroke-[2] relative z-10" />
              <span className="relative z-10">Buy Now</span>
            </button>
          </div>
        </div>
      </article>
    );
  };

  if (!isSlider) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {products.map((product, idx) => (
          <ScrollReveal key={`${groupId}-${product.id}`} variant="fade-up" delay={idx * 70}>
            {renderCard(product)}
          </ScrollReveal>
        ))}
      </div>
    );
  }

  // Single-row one-after-another sliding track for categories with > 4 products
  return (
    <ScrollReveal variant="fade-up">
      <div
        className="relative group/slider"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
      {/* Left Arrow */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-1.5 sm:-left-3 lg:-left-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-full bg-white/95 hover:bg-[#0A2E73] active:scale-95 text-[#0A2E73] hover:text-white border border-[#E2E8F0] shadow-[0_6px_20px_rgba(10,46,115,0.16)] flex items-center justify-center transition-all duration-200 cursor-pointer"
        aria-label="Previous product"
      >
        <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
      </button>

      {/* Right Arrow */}
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-1.5 sm:-right-3 lg:-right-4 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 min-w-[44px] min-h-[44px] rounded-full bg-white/95 hover:bg-[#0A2E73] active:scale-95 text-[#0A2E73] hover:text-white border border-[#E2E8F0] shadow-[0_6px_20px_rgba(10,46,115,0.16)] flex items-center justify-center transition-all duration-200 cursor-pointer"
        aria-label="Next product"
      >
        <ChevronRight className="w-5 h-5 stroke-[2.2]" />
      </button>

      {/* Single-Row Viewport */}
      <div className="overflow-hidden py-1 -my-1">
        <div
          className="flex flex-nowrap gap-0 sm:gap-6 transition-transform duration-700 ease-in-out"
          style={{
            transform:
              visibleCols === 1
                ? `translateX(-${startIndex * 100}%)`
                : `translateX(calc(-${startIndex} * ((100% + 24px) / ${visibleCols})))`,
          }}
        >
          {products.map((product) => renderCard(product))}
        </div>
      </div>

      {/* Step Indicator Dots */}
      {maxStartIndex > 0 && (
        <div className="flex items-center justify-center gap-2 mt-5">
          {Array.from({ length: maxStartIndex + 1 }).map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setStartIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                idx === startIndex
                  ? 'w-7 bg-[#E3262E]'
                  : 'w-2 bg-[#0A2E73]/25 hover:bg-[#0A2E73]/50'
              }`}
              aria-label={`Show product position ${idx + 1}`}
            />
          ))}
        </div>
      )}
      </div>
    </ScrollReveal>
  );
};

export const MattressCatalogueSection: React.FC<MattressCatalogueSectionProps> = ({
  initialCategory = null,
}) => {
  const { navigateToProduct } = useNavigation();
  const { homePageData, mattressesData } = useHomePageContent();
  const cmsCategories =
    mattressesData.catalogueCategories.length > 0
      ? mattressesData.catalogueCategories
      : CATALOGUE_CATEGORIES;
  const cmsModels =
    mattressesData.mattressModels.length > 0
      ? mattressesData.mattressModels
      : BED_PRICE_CATALOGUE_PRODUCTS;

  const resolveInitialCategory = (cat: string | null): CatalogueCategoryId | 'all' => {
    if (!cat || cat === 'all') return 'all';
    if (cat === 'memory-foam' || cat === 'foam') return 'foam';
    if (cat === 'spring') return 'spring';
    if (cat === 'orthopedic' || cat === 'coir') return 'orthopedic';
    if (cat === 'latex' || cat === 'hybrid') return 'latex';
    if (cat === 'cooling') return 'cooling';
    return 'all';
  };

  const [selectedCategory, setSelectedCategory] = useState<CatalogueCategoryId | 'all'>(() =>
    resolveInitialCategory(initialCategory)
  );
  const [selectedSizeKey, setSelectedSizeKey] = useState<string>('72x30');
  const [pgCustomProducts, setPgCustomProducts] = useState<PgProductRecord[]>([]);

  useEffect(() => {
    setSelectedCategory(resolveInitialCategory(initialCategory));
  }, [initialCategory]);

  useEffect(() => {
    fetchProductsFromPg().then((rows) => {
      if (rows && rows.length > 0) setPgCustomProducts(rows);
    });
  }, []);

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
        topFinishStyle: (r.top_finish_style || 'Euro / Box Top') as CatalogueMattressProduct['topFinishStyle'],
        warrantyMonths: Number(r.warranty_months) || 60,
        warrantyYears: Math.round((Number(r.warranty_months) || 60) / 12),
        startingPrice: Number(r.starting_price) || 14999,
        thicknessOptions: r.thickness_options?.length ? r.thickness_options : [6, 8],
        images: {
          ...baseTemplate.images,
          hero:
            r.hero_image &&
            !r.hero_image.startsWith('/images/type_') &&
            !r.hero_image.startsWith('/images/mat_') &&
            !r.hero_image.startsWith('/images/design_')
              ? r.hero_image
              : '/images/products/product-deluxe.jpg',
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
      return { mrp: product.startingPrice };
    }
    const defaultThickness = product.thicknessOptions[0];
    return (
      getCatalogueVariantPrice(
        product,
        activeDimension.lengthInches,
        activeDimension.widthInches,
        defaultThickness
      ) || { mrp: product.startingPrice }
    );
  };

  // Group products cleanly by the official categories
  const categoryGroups = useMemo(() => {
    const categoriesToShow =
      selectedCategory === 'all'
        ? cmsCategories.filter((c) => c.id !== 'all')
        : cmsCategories.filter((c) => c.id === selectedCategory);

    return categoriesToShow
      .map((cat) => ({
        id: cat.id as CatalogueCategoryId,
        label: cat.label,
        shortLabel: cat.shortLabel,
        description: cat.description,
        products: allCatalogueProducts.filter((p) =>
          p.categories.includes(cat.id as CatalogueCategoryId)
        ),
      }))
      .filter((group) => group.products.length > 0);
  }, [selectedCategory, allCatalogueProducts, cmsCategories]);

  return (
    <section
      id="mattress-catalogue"
      className="w-full bg-[#F8FAFC] text-[#0A2540] font-dm py-12 sm:py-16"
    >
      <div id="catalogue-grid" className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        {/* Clean Minimal Header & Category Navigation */}
        <ScrollReveal variant="fade-up">
          <div className="flex flex-col gap-6 border-b border-[#E2E8F0] pb-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.06em] text-[#0F62C8] block">
                  {homePageData.catalogueHeader.eyebrow}
                </span>
                <h2 className="text-2xl sm:text-3xl font-semibold text-[#0A2E73] leading-[1.3] mt-1">
                  {homePageData.catalogueHeader.title}
                </h2>
              </div>

              {/* Compact Thumb-Friendly Size Selector (min 48px height) */}
              <div className="flex items-center gap-2 w-full sm:w-auto max-w-full min-h-[48px] overflow-hidden self-start md:self-auto bg-white px-4 py-2.5 rounded-2xl border border-[#E2E8F0] shadow-2xs">
                <Ruler className="w-4 h-4 text-[#E3262E] shrink-0" />
                <span className="text-[12px] font-medium text-[#475569] whitespace-nowrap shrink-0">
                  Size:
                </span>
                <select
                  aria-label="Select Mattress Size"
                  value={selectedSizeKey}
                  onChange={(e) => setSelectedSizeKey(e.target.value)}
                  className="flex-1 min-w-0 max-w-full truncate bg-transparent text-[13px] font-semibold text-[#0A2E73] focus:outline-none cursor-pointer"
                >
                  {STANDARD_CATALOGUE_SIZES.map((sz) => (
                    <option key={sz.sizeInches} value={`${sz.lengthInches}x${sz.widthInches}`}>
                      {sz.sizeInches}" ({sz.sizeFeet} ft — {sz.sizeGroup})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clean Thumb-Friendly Category Filter Pills (min 48px height) */}
            <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 no-scrollbar">
              {cmsCategories.map((tab) => {
                const active = selectedCategory === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedCategory(tab.id)}
                    className={`min-h-[48px] px-5 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                      active
                        ? 'bg-[#0A2E73] text-white shadow-[0_6px_16px_rgba(10,46,115,0.2)]'
                        : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73] hover:text-[#0A2E73] shadow-2xs'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>
        </ScrollReveal>

        {/* Category Sections with Single-Row 4-Column Cards (sliding one after another when > 4) */}
        <div className="space-y-14">
          {categoryGroups.map((group) => (
            <div key={group.id} className="space-y-6">
              {/* Category Title Row */}
              <ScrollReveal variant="fade-up">
                <div className="flex items-baseline justify-between gap-4">
                  <div>
                    <h3 className="text-[22px] font-semibold text-[#0A2E73] leading-[1.3]">
                      {group.label}
                    </h3>
                    <p className="text-[14px] font-normal text-[#475569] leading-[1.6] mt-0.5">
                      {group.description}
                    </p>
                  </div>
                  <span className="text-[12px] font-medium text-[#64748B] shrink-0">
                    {group.products.length} {group.products.length === 1 ? 'Model' : 'Models'}
                  </span>
                </div>
              </ScrollReveal>

              {/* Single-Row Product Display */}
              <CategoryProductRow
                groupId={group.id}
                products={group.products}
                getCardVariant={getCardVariant}
                onSelectProduct={navigateToProduct}
              />

              {/* Personalized Mattress Recommendation Animated PNG Banner below Cooling Technology Mattresses */}
              {group.id === 'cooling' && (
                <ScrollReveal variant="scale-up" delay={100}>
                  <MattressQuizBanner />
                </ScrollReveal>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
