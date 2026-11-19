import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Layers,
  Ruler,
  Check,
  ShoppingBag,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  X,
  FileText,
  Sparkles,
  AlertCircle,
  Heart,
  PhoneCall,
  CheckCircle2,
  Info,
} from 'lucide-react';
import {
  BED_PRICE_CATALOGUE_PRODUCTS,
  STANDARD_CATALOGUE_SIZES,
  formatIndianRupeeExact,
  getCatalogueVariantPrice,
  type CatalogueMattressProduct,
} from '../../data/bedPriceCatalogueData';
import { useCart } from '../../context/CartContext';
import { useNavigation } from '../../context/NavigationContext';

interface CatalogueProductDetailPageProps {
  product: CatalogueMattressProduct;
}

export const CatalogueProductDetailPage: React.FC<CatalogueProductDetailPageProps> = ({
  product,
}) => {
  const { addToCart, toggleWishlist, isWishlisted } = useCart();
  const { navigateToMattresses, navigateToProduct } = useNavigation();

  // Gallery state (4-View Product Gallery — PDF MRP sheet removed)
  const galleryItems = useMemo(
    () => [
      {
        id: 'hero',
        label: 'Studio Product View',
        caption: `${product.name} — Studio Profile & Construction Overview`,
        url: product.images.hero,
      },
      {
        id: 'layers',
        label: 'Official Layer Diagram',
        caption: `${product.name} — Layer Callout & Cross-Section`,
        url: product.images.layers,
      },
      {
        id: 'texture',
        label: 'Cutaway & Quilting Detail',
        caption: `${product.name} — Multi-Layer Cutaway & Surface Finish`,
        url: product.images.texture,
      },
      {
        id: 'lifestyle',
        label: 'Bedroom Suite View',
        caption: `${product.name} — Styled on an Architectural Platform Bed`,
        url: product.images.lifestyle,
      },
    ],
    [product]
  );

  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Size & Thickness Selection State
  const [sizeGroupFilter, setSizeGroupFilter] = useState<string>('All');
  const [selectedLength, setSelectedLength] = useState<number>(72);
  const [selectedWidth, setSelectedWidth] = useState<number>(30);
  const [selectedThickness, setSelectedThickness] = useState<number>(product.thicknessOptions[0]);
  const [quantity, setQuantity] = useState<number>(1);
  const [activeLayerOrder, setActiveLayerOrder] = useState<number>(1);
  const [isEnquiryOpen, setIsEnquiryOpen] = useState<boolean>(false);
  const [enquirySubmitted, setEnquirySubmitted] = useState<boolean>(false);
  const [enquiryForm, setEnquiryForm] = useState({
    name: '',
    phone: '',
    city: '',
    notes: '',
  });

  // Reset state when switching products
  useEffect(() => {
    setActiveImageIdx(0);
    setSelectedLength(72);
    setSelectedWidth(30);
    setSelectedThickness(product.thicknessOptions[0]);
    setQuantity(1);
    setActiveLayerOrder(1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product.id, product.thicknessOptions]);

  const filteredSizes = useMemo(() => {
    if (sizeGroupFilter === 'All') return STANDARD_CATALOGUE_SIZES;
    return STANDARD_CATALOGUE_SIZES.filter((s) => s.sizeGroup === sizeGroupFilter);
  }, [sizeGroupFilter]);

  const activeSizeMeta = useMemo(
    () =>
      STANDARD_CATALOGUE_SIZES.find(
        (s) => s.lengthInches === selectedLength && s.widthInches === selectedWidth
      ) || STANDARD_CATALOGUE_SIZES[0],
    [selectedLength, selectedWidth]
  );

  const activeVariant = useMemo(
    () =>
      getCatalogueVariantPrice(product, selectedLength, selectedWidth, selectedThickness) ||
      product.priceMatrix[0],
    [product, selectedLength, selectedWidth, selectedThickness]
  );

  const similarProducts = useMemo(() => {
    return BED_PRICE_CATALOGUE_PRODUCTS.filter(
      (p) =>
        p.id !== product.id &&
        (p.categories.some((c) => product.categories.includes(c)) ||
          p.constructionFamily === product.constructionFamily)
    ).slice(0, 4);
  }, [product]);

  const handleAddToCart = () => {
    if (!activeVariant) return;
    const sku = `CAT-${product.id.toUpperCase()}-${activeVariant.lengthInches}X${activeVariant.widthInches}-${activeVariant.thicknessInches}IN`;
    addToCart(
      {
        id: product.id,
        sku,
        name: `${product.name} (${activeVariant.sizeFeet} ft)`,
        size: `${activeVariant.sizeInches}" (${activeVariant.sizeFeet} ft)`,
        thickness: `${activeVariant.thicknessInches} Inch`,
        price: activeVariant.mrp,
        originalPrice: activeVariant.mrp,
        image: product.images.hero,
      },
      quantity
    );
  };

  const handleMatrixCellSelect = (lengthInches: number, widthInches: number, thicknessInches: number) => {
    setSelectedLength(lengthInches);
    setSelectedWidth(widthInches);
    setSelectedThickness(thicknessInches);
    setSizeGroupFilter('All');
    const configuratorEl = document.getElementById('pdp-variant-configurator');
    if (configuratorEl) {
      configuratorEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setEnquirySubmitted(true);
    setTimeout(() => {
      setIsEnquiryOpen(false);
      setEnquirySubmitted(false);
    }, 2200);
  };

  const wishlisted = isWishlisted(product.id);

  return (
    <article className="w-full bg-[#F8FAFC] min-h-screen text-[#0A2540] font-dm pb-24">
      {/* Top Breadcrumb Bar */}
      <div className="bg-[#0A2E73] text-[#F8FAFC] border-b border-white/10">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-3 text-[12px] font-medium">
          <div className="flex items-center gap-2 text-white/75">
            <button
              type="button"
              onClick={() => navigateToMattresses('all')}
              className="inline-flex items-center gap-1.5 text-white hover:text-white/80 font-semibold transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-white" />
              <span>Back to 14-Model Mattress Catalogue</span>
            </button>
            <span className="text-white/30">/</span>
            <span className="text-white/70">{product.category}</span>
            <span className="text-white/30">/</span>
            <span className="text-white font-semibold">{product.name}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[12px] font-medium">
              <FileText className="w-3 h-3 text-white" />
              PDF Catalogue Page {product.pageNumber} of 14
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-white text-[12px] font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
              {product.warrantyMonths} Months ({product.warrantyYears} Years) Warranty
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: HERO GALLERY & INTERACTIVE VARIANT CONFIGURATOR */}
      <section className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 pt-8 sm:pt-10 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-start">
          {/* LEFT: 5-View Interactive Product Gallery (Cols 1-7) */}
          <div className="lg:col-span-7 lg:sticky lg:top-24 space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-white border border-[#E2E8F0] shadow-lg group aspect-[4/3] flex items-center justify-center p-2">
              <img
                src={galleryItems[activeImageIdx]?.url}
                alt={galleryItems[activeImageIdx]?.caption}
                className="max-w-full max-h-full w-auto h-auto object-contain bg-white"
              />

              {/* Top Overlay Badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 pointer-events-none">
                <span className="px-3.5 py-1.5 rounded-full bg-[#0A2E73]/90 backdrop-blur-md text-white text-[11px] font-semibold tracking-[0.04em] uppercase shadow">
                  {product.category}
                </span>
                <span className="px-3.5 py-1.5 rounded-full bg-[#E3262E] text-white text-[12px] font-medium shadow">
                  {product.warrantyMonths} Months Warranty
                </span>
              </div>

              {/* Zoom Button */}
              <button
                type="button"
                onClick={() => setIsLightboxOpen(true)}
                className="absolute bottom-4 right-4 px-3.5 py-2 rounded-xl bg-[#0A2E73]/90 hover:bg-[#0A2E73] text-white text-[14px] font-semibold flex items-center gap-1.5 shadow-lg transition-all cursor-pointer"
              >
                <ZoomIn className="w-4 h-4 text-white" />
                <span>Inspect High-Res View</span>
              </button>
            </div>

            {/* Caption Bar */}
            <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[12px] font-medium text-[#475569]">
              <span className="font-medium text-[#0A2540]">
                {galleryItems[activeImageIdx]?.caption}
              </span>
              <span className="text-[12px] font-medium text-[#0F62C8]">
                View {activeImageIdx + 1} of {galleryItems.length}
              </span>
            </div>

            {/* Thumbnail Strip */}
            <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
              {galleryItems.map((item, idx) => {
                const isSelected = idx === activeImageIdx;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveImageIdx(idx)}
                    className={`group relative rounded-2xl overflow-hidden border-2 transition-all text-left cursor-pointer bg-white ${
                      isSelected
                        ? 'border-[#0A2E73] ring-2 ring-[#E3262E]/40 shadow-md'
                        : 'border-[#E2E8F0] opacity-75 hover:opacity-100'
                    }`}
                  >
                    <div className="aspect-[4/3] w-full overflow-hidden bg-white flex items-center justify-center p-1">
                      <img
                        src={item.url}
                        alt={item.label}
                        className="max-w-full max-h-full w-auto h-auto object-contain"
                      />
                    </div>
                    <div className="p-1.5 text-center bg-white border-t border-[#E2E8F0]">
                      <p className="text-[11px] font-semibold tracking-[0.04em] text-[#0A2540] truncate">
                        {item.label}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Quick Catalogue Feature Badges from PDF Bottom Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 pt-2">
              {product.catalogueBadges.map((badge) => (
                <div
                  key={badge}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white border border-[#E2E8F0] text-[12px] font-medium text-[#0A2540]"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#E3262E] shrink-0" />
                  <span className="truncate">{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT: Interactive Pricing & Variant Configurator (Cols 8-12) */}
          <div
            id="pdp-variant-configurator"
            className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] shadow-xl p-6 sm:p-8 space-y-6"
          >
            {/* Title & Tagline */}
            <div className="space-y-2 border-b border-[#E2E8F0] pb-5">
              <div className="flex items-center justify-between gap-2">
                <span className="px-3 py-1 rounded-full bg-[#0A2E73] text-white text-[11px] uppercase tracking-[0.04em] font-semibold">
                  MODEL #{String(product.pageNumber).padStart(2, '0')} • {product.constructionFamily}
                </span>
                <button
                  type="button"
                  onClick={() => toggleWishlist(product.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[12px] font-medium border transition-colors cursor-pointer ${
                    wishlisted
                      ? 'bg-rose-50 border-rose-200 text-rose-600'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#475569] hover:text-[#0A2540]'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${wishlisted ? 'fill-rose-500 text-rose-500' : ''}`} />
                  <span>{wishlisted ? 'Saved' : 'Save'}</span>
                </button>
              </div>

              <h1 className="font-dm text-[22px] sm:text-3xl font-semibold text-[#0A2E73] leading-[1.3]">
                {product.name}
              </h1>
              <p className="font-dm text-[14px] font-medium text-[#0F62C8] leading-[1.6]">{product.tagline}</p>
              <p className="font-dm text-[14px] font-normal text-[#475569] leading-[1.6] pt-1">
                {product.shortDescription}
              </p>
            </div>

            {/* Dynamic Exact MRP Display Box */}
            <div className="rounded-2xl bg-[#0A2E73] text-white p-5 space-y-3 relative overflow-hidden">
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-white block">
                    EXACT CATALOGUE MRP ({activeSizeMeta.sizeInches}" • {selectedThickness}")
                  </span>
                  <div className="text-[22px] sm:text-3xl font-dm font-bold text-white mt-1">
                    {activeVariant ? formatIndianRupeeExact(activeVariant.mrp) : 'N/A'}
                  </div>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 rounded-full bg-white/15 border border-white/30 text-white text-[11px] font-semibold tracking-[0.04em]">
                    {activeSizeMeta.sizeFeet} ft ({activeSizeMeta.sizeGroup})
                  </span>
                  <p className="text-[12px] font-medium text-white/70 mt-1">
                    Thickness: <strong className="text-white font-semibold">{selectedThickness} Inches</strong>
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium text-white/75">
                <span>*Prices are inclusive of all taxes (Official PDF MRP)</span>
                {activeVariant?.verified ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300 font-medium">
                    <Check className="w-3.5 h-3.5" /> Direct Verified PDF Cell
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-amber-300 font-medium">
                    <AlertCircle className="w-3.5 h-3.5" /> Glare-Audited Cell
                  </span>
                )}
              </div>

              {!activeVariant?.verified && activeVariant?.verificationNote && (
                <div className="rounded-xl bg-amber-500/15 border border-amber-400/30 p-2.5 text-[12px] font-medium text-amber-100 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                  <span>{activeVariant.verificationNote}</span>
                </div>
              )}
            </div>

            {/* STEP 1: Select Thickness */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0A2540] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#E3262E]" />
                  <span>1. Select Mattress Thickness</span>
                </label>
                <span className="text-[12px] font-medium text-[#475569]">
                  Offered in {product.thicknessOptions.map((t) => `${t}"`).join(', ')}
                </span>
              </div>

              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                {[5, 6, 8, 10].map((thickness) => {
                  const isSupported = product.thicknessOptions.includes(thickness);
                  const isSelected = selectedThickness === thickness;
                  const sampleVariant = isSupported
                    ? getCatalogueVariantPrice(product, selectedLength, selectedWidth, thickness)
                    : undefined;

                  return (
                    <button
                      key={thickness}
                      type="button"
                      disabled={!isSupported}
                      onClick={() => isSupported && setSelectedThickness(thickness)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        !isSupported
                          ? 'bg-gray-100 border-gray-200 text-gray-400 opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-[#0A2E73] border-[#0A2E73] text-white shadow-md cursor-pointer'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0A2540] hover:border-[#E3262E] cursor-pointer'
                      }`}
                    >
                      <div className="text-[14px] font-semibold">{thickness} Inch</div>
                      <div
                        className={`text-[12px] font-medium mt-0.5 ${
                          !isSupported
                            ? 'text-gray-400'
                            : isSelected
                            ? 'text-white'
                            : 'text-[#475569]'
                        }`}
                      >
                        {isSupported && sampleVariant
                          ? formatIndianRupeeExact(sampleVariant.mrp)
                          : 'Not Offered'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 2: Select Mattress Size (Length × Breadth) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <label className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0A2540] flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-[#E3262E]" />
                  <span>2. Select Dimensions (Inches & Feet)</span>
                </label>
                <span className="text-[12px] font-medium text-[#475569]">17 Standard Catalogue Sizes</span>
              </div>

              {/* Size Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                {['All', 'Single', 'Diwan / Compact Double', 'Double', 'Queen', 'King'].map(
                  (grp) => (
                    <button
                      key={grp}
                      type="button"
                      onClick={() => setSizeGroupFilter(grp)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold tracking-[0.04em] whitespace-nowrap transition-colors cursor-pointer ${
                        sizeGroupFilter === grp
                          ? 'bg-[#E3262E] text-white'
                          : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#E2E8F0]/60'
                      }`}
                    >
                      {grp}
                    </button>
                  )
                )}
              </div>

              {/* Size Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {filteredSizes.map((sz) => {
                  const isSelected =
                    sz.lengthInches === selectedLength && sz.widthInches === selectedWidth;
                  const priceForSize = getCatalogueVariantPrice(
                    product,
                    sz.lengthInches,
                    sz.widthInches,
                    selectedThickness
                  );

                  return (
                    <button
                      key={sz.sizeInches}
                      type="button"
                      onClick={() => {
                        setSelectedLength(sz.lengthInches);
                        setSelectedWidth(sz.widthInches);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#0A2E73] border-[#0A2E73] text-white shadow-sm'
                          : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#0A2540] hover:border-[#E3262E]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-[12px] font-medium">{sz.sizeInches}"</span>
                        <span
                          className={`text-[12px] font-medium ${
                            isSelected ? 'text-white' : 'text-[#64748B]'
                          }`}
                        >
                          {sz.sizeFeet} ft
                        </span>
                      </div>
                      <div
                        className={`text-[12px] font-semibold mt-1 ${
                          isSelected ? 'text-white' : 'text-[#0A2E73]'
                        }`}
                      >
                        {priceForSize ? formatIndianRupeeExact(priceForSize.mrp) : '—'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* STEP 3: Quantity & Actions */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-[#E2E8F0] rounded-xl bg-[#F8FAFC]">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-3.5 py-2.5 text-[14px] font-semibold text-[#0A2540] hover:bg-[#E2E8F0]/50 rounded-l-xl cursor-pointer"
                  >
                    −
                  </button>
                  <span className="px-3 text-[14px] font-semibold text-[#0A2540]">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="px-3.5 py-2.5 text-[14px] font-semibold text-[#0A2540] hover:bg-[#E2E8F0]/50 rounded-r-xl cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3.5 px-5 rounded-xl bg-[#0A2E73] hover:bg-[#0E3B91] text-white font-semibold text-[14px] flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                >
                  <ShoppingBag className="w-4 h-4 text-white" />
                  <span>
                    Add to Cart •{' '}
                    {activeVariant
                      ? formatIndianRupeeExact(activeVariant.mrp * quantity)
                      : ''}
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsEnquiryOpen(true)}
                className="w-full py-3 px-4 rounded-xl border border-[#E3262E] bg-[#E3262E]/10 hover:bg-[#E3262E]/20 text-[#0A2E73] font-semibold text-[14px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <PhoneCall className="w-4 h-4 text-[#0F62C8]" />
                <span>
                  Enquire About {product.name} ({activeSizeMeta.sizeInches}" × {selectedThickness}")
                </span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: INTERACTIVE "INSIDE YOUR MATTRESS" CONSTRUCTION VISUALIZER */}
      <section className="bg-[#0A2E73] text-[#F8FAFC] py-16 sm:py-20">
        <div className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/15 pb-8">
            <div className="space-y-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-white text-[11px] font-semibold uppercase tracking-[0.04em]">
                <Sparkles className="w-3.5 h-3.5 text-white" />
                <span>Inside Your Mattress • Official PDF Layer Stack</span>
              </div>
              <h2 className="font-dm text-[22px] sm:text-3xl font-semibold text-white leading-[1.3]">
                {product.name} — {product.layers.length}-Layer Construction Architecture
              </h2>
              <p className="text-[14px] font-normal leading-[1.6] text-white/75">
                Every material layer below is extracted directly from Page {product.pageNumber} of the
                official specification sheet in exact top-to-bottom order. Click any layer to inspect its
                purpose and technical parameters.
              </p>
            </div>
            <div className="text-left md:text-right">
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-white/60 block">
                Top Surface Profile
              </span>
              <span className="font-dm text-xl text-white font-semibold">
                {product.topFinishStyle}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            {/* Left: Interactive Exploded Stack Graphic + Official Diagram Preview (Cols 1-6) */}
            <div className="lg:col-span-6 space-y-6">
              {/* Visual Interactive Stack */}
              <div className="rounded-3xl bg-white/5 border border-white/15 p-6 space-y-3">
                <div className="flex items-center justify-between text-[12px] font-medium text-white/70 pb-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-white">
                    Interactive Cross-Section (Top → Bottom)
                  </span>
                  <span>Click a layer bar to inspect</span>
                </div>

                <div className="space-y-2.5">
                  {product.layers.map((layer) => {
                    const isActive = layer.order === activeLayerOrder;
                    return (
                      <button
                        key={layer.order}
                        type="button"
                        onClick={() => setActiveLayerOrder(layer.order)}
                        className={`w-full rounded-2xl p-4 text-left transition-all flex items-center justify-between gap-4 cursor-pointer border ${
                          isActive
                            ? 'bg-white text-[#0A2E73] border-white shadow-xl scale-[1.01]'
                            : 'bg-white/10 text-white border-white/10 hover:bg-white/15'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span
                            className="w-9 h-9 rounded-xl flex items-center justify-center text-[12px] font-semibold shrink-0 shadow-inner"
                            style={{
                              backgroundColor: layer.colorHex,
                              color: '#0A2E73',
                            }}
                          >
                            0{layer.order}
                          </span>
                          <div className="min-w-0">
                            <p
                              className={`text-[11px] font-semibold uppercase tracking-[0.04em] ${
                                isActive ? 'text-[#0F62C8]' : 'text-white'
                              }`}
                            >
                              {layer.name}
                            </p>
                            <p
                              className={`text-[12px] font-medium truncate ${
                                isActive ? 'text-[#0A2E73]' : 'text-white'
                              }`}
                            >
                              {layer.material}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {layer.density && (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[12px] font-medium ${
                                isActive
                                  ? 'bg-[#0A2E73] text-white'
                                  : 'bg-white/15 text-white'
                              }`}
                            >
                              {layer.density}
                            </span>
                          )}
                          {layer.thicknessMm && (
                            <span
                              className={`px-2.5 py-1 rounded-lg text-[12px] font-medium ${
                                isActive
                                  ? 'bg-[#0A2E73] text-white'
                                  : 'bg-white/15 text-white'
                              }`}
                            >
                              {layer.thicknessMm} mm
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Selected Layer Detail + Authentic PDF Diagram Image (Cols 7-12) */}
            <div className="lg:col-span-6 space-y-6">
              {product.layers
                .filter((l) => l.order === activeLayerOrder)
                .map((activeLayer) => (
                  <div
                    key={activeLayer.order}
                    className="rounded-3xl bg-white text-[#0A2540] p-6 sm:p-8 shadow-xl space-y-4"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-3 py-1 rounded-full bg-[#0A2E73] text-white text-[11px] font-semibold tracking-[0.04em]">
                        LAYER 0{activeLayer.order} OF 0{product.layers.length}
                      </span>
                      <span className="text-[12px] font-medium text-[#64748B]">
                        {activeLayer.order === 1
                          ? 'Top Quilted Comfort Surface'
                          : activeLayer.order === product.layers.length
                          ? 'Foundational Support Base'
                          : 'Internal Core Layer'}
                      </span>
                    </div>

                    <h3 className="font-dm text-[22px] font-semibold text-[#0A2E73] leading-[1.3]">
                      {activeLayer.name}: {activeLayer.material}
                    </h3>

                    <p className="text-[14px] font-normal text-[#475569] leading-[1.6]">
                      {activeLayer.purpose}
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] block">
                          Layer Position
                        </span>
                        <span className="text-[12px] font-medium text-[#0A2E73]">
                          #{activeLayer.order} (Top-Down)
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] block">
                          Specified Density
                        </span>
                        <span className="text-[12px] font-medium text-[#0A2E73]">
                          {activeLayer.density || 'Standard Spec'}
                        </span>
                      </div>
                      <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                        <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#64748B] block">
                          Layer Thickness
                        </span>
                        <span className="text-[12px] font-medium text-[#0A2E73]">
                          {activeLayer.thicknessMm ? `${activeLayer.thicknessMm} mm` : 'Proportional to Height'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Authentic Cropped PDF Layer Diagram */}
              <div className="rounded-3xl overflow-hidden bg-white border border-white/20 p-4 text-[#0A2540]">
                <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0A2E73]">
                    Original Catalogue Diagram (Page {product.pageNumber})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageIdx(1);
                      setIsLightboxOpen(true);
                    }}
                    className="text-[14px] font-semibold text-[#0F62C8] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <ZoomIn className="w-3.5 h-3.5" /> Enlarge Diagram
                  </button>
                </div>
                <img
                  src={product.images.layers}
                  alt={`${product.name} official layer diagram`}
                  className="w-full max-h-80 object-contain rounded-2xl bg-[#F8FAFC]"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 3: COMPLETE AVAILABLE SIZES & MRP MATRIX TABLE */}
      <section className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-20 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0F62C8]">
              OFFICIAL MRP PRICE MATRIX • PAGE {product.pageNumber} OF 14
            </span>
            <h2 className="font-dm text-[22px] sm:text-3xl font-semibold text-[#0A2E73] leading-[1.3] mt-1">
              {product.name} — Complete Size & Thickness Price Table
            </h2>
            <p className="text-[14px] font-normal leading-[1.6] text-[#475569] mt-1">
              Click any price cell below to select that exact size and thickness configuration above. All
              prices are in Indian Rupees (₹) and inclusive of all taxes.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setActiveImageIdx(4);
              setIsLightboxOpen(true);
            }}
            className="self-start lg:self-auto px-4 py-2.5 rounded-xl bg-white border border-[#E2E8F0] hover:border-[#E3262E] text-[14px] font-semibold text-[#0A2E73] flex items-center gap-2 shadow-sm cursor-pointer"
          >
            <FileText className="w-4 h-4 text-[#E3262E]" />
            <span>View Original Printed PDF Page {product.pageNumber}</span>
          </button>
        </div>

        {product.hasUnverifiedCells && product.verificationSummary && (
          <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-[12px] font-medium text-amber-900 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <strong className="font-semibold block mb-0.5">
                PDF Optical Scan Verification Note (Page {product.pageNumber}):
              </strong>
              <span>{product.verificationSummary}</span>
            </div>
          </div>
        )}

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#0A2E73] text-white text-[11px] font-semibold uppercase tracking-[0.04em]">
                  <th className="py-4 px-5 font-semibold">Size in Feet</th>
                  <th className="py-4 px-5 font-semibold">Size in Inches</th>
                  <th className="py-4 px-5 font-semibold">Category</th>
                  {product.thicknessOptions.map((t) => (
                    <th key={t} className="py-4 px-5 font-semibold text-right">
                      {t} Inch MRP
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] text-[12px] font-medium">
                {STANDARD_CATALOGUE_SIZES.map((sz, rowIdx) => {
                  const isRowSelected =
                    sz.lengthInches === selectedLength && sz.widthInches === selectedWidth;

                  return (
                    <tr
                      key={sz.sizeInches}
                      className={`transition-colors ${
                        isRowSelected
                          ? 'bg-[#E3262E]/10'
                          : rowIdx % 2 === 0
                          ? 'bg-white'
                          : 'bg-[#F8FAFC]/60'
                      } hover:bg-[#E3262E]/15`}
                    >
                      <td className="py-3.5 px-5 font-semibold text-[#0A2E73]">
                        {sz.sizeFeet} ft
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-[#0A2540]">{sz.sizeInches}"</td>
                      <td className="py-3.5 px-5 text-[12px] font-medium text-[#475569]">{sz.sizeGroup}</td>
                      {product.thicknessOptions.map((t) => {
                        const cell = getCatalogueVariantPrice(
                          product,
                          sz.lengthInches,
                          sz.widthInches,
                          t
                        );
                        const isExactCellSelected = isRowSelected && selectedThickness === t;

                        return (
                          <td key={t} className="py-2.5 px-4 text-right">
                            {cell ? (
                              <button
                                type="button"
                                onClick={() =>
                                  handleMatrixCellSelect(sz.lengthInches, sz.widthInches, t)
                                }
                                className={`inline-flex items-center justify-end gap-1.5 px-3 py-1.5 rounded-xl font-dm text-[14px] font-semibold transition-all cursor-pointer ${
                                  isExactCellSelected
                                    ? 'bg-[#0A2E73] text-white ring-2 ring-[#0A2E73] shadow'
                                    : 'text-[#0A2540] hover:bg-[#0A2E73] hover:text-white'
                                }`}
                                title={
                                  cell.verified
                                    ? `Select ${sz.sizeInches}" × ${t}" (${formatIndianRupeeExact(cell.mrp)})`
                                    : cell.verificationNote
                                }
                              >
                                <span>{formatIndianRupeeExact(cell.mrp)}</span>
                                {!cell.verified && (
                                  <span
                                    className="text-[11px] text-amber-600 font-bold"
                                    title={cell.verificationNote}
                                  >
                                    *
                                  </span>
                                )}
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-[#F8FAFC] px-6 py-3.5 border-t border-[#E2E8F0] flex flex-wrap items-center justify-between gap-2 text-[12px] font-medium text-[#475569]">
            <span>
              *Prices are inclusive of all taxes. *Prices are subject to change without prior notice.
            </span>
            <span>
              Warranty: <strong className="text-[#0A2E73] font-semibold">{product.warrantyMonths} Months</strong>
            </span>
          </div>
        </div>
      </section>

      {/* SECTION 4: TECHNICAL SPECIFICATIONS & WARRANTY SUMMARY */}
      <section className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0F62C8]">
              TECHNICAL PROFILE
            </span>
            <h3 className="font-dm text-[22px] font-semibold text-[#0A2E73] leading-[1.3]">
              Model Specifications
            </h3>
            <dl className="space-y-3 text-[12px] font-medium pt-2">
              <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                <dt className="text-[#475569]">Official Model Name</dt>
                <dd className="font-semibold text-[#0A2E73]">{product.name}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                <dt className="text-[#475569]">Catalogue Page</dt>
                <dd className="font-semibold text-[#0A2E73]">
                  Page {product.pageNumber} of 14
                </dd>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                <dt className="text-[#475569]">Construction Type</dt>
                <dd className="font-semibold text-[#0A2E73]">{product.constructionFamily}</dd>
              </div>
              <div className="flex justify-between py-2 border-b border-[#E2E8F0]">
                <dt className="text-[#475569]">Surface Finish</dt>
                <dd className="font-semibold text-[#0A2E73]">{product.topFinishStyle}</dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-[#475569]">Offered Thicknesses</dt>
                <dd className="font-semibold text-[#0A2E73]">
                  {product.thicknessOptions.map((t) => `${t}"`).join(', ')}
                </dd>
              </div>
            </dl>
          </div>

          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 sm:p-8 space-y-4">
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0F62C8]">
              DOCUMENTED FEATURES
            </span>
            <h3 className="font-dm text-[22px] font-semibold text-[#0A2E73] leading-[1.3]">
              Construction Highlights
            </h3>
            <ul className="space-y-3 pt-2">
              {product.features.map((feat) => (
                <li key={feat} className="flex items-start gap-2.5 text-[14px] font-normal leading-[1.6] text-[#0A2540]">
                  <Check className="w-4 h-4 text-[#E3262E] shrink-0 mt-1" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0A2E73] text-white rounded-3xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center text-white">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-white block">
                OFFICIAL CATALOGUE WARRANTY
              </span>
              <h3 className="font-dm text-[22px] sm:text-3xl font-semibold leading-[1.3]">
                {product.warrantyMonths} Months Warranty
              </h3>
              <p className="text-[14px] font-normal text-white/80 leading-[1.6]">
                Backed by an official {product.warrantyMonths}-month ({product.warrantyYears}-year)
                manufacturer warranty as specified on Page {product.pageNumber} of the product
                catalogue.
              </p>
            </div>

            <div className="pt-4 border-t border-white/15 flex items-center justify-between text-[12px] font-medium text-white/70">
              <span>Price Range Across 17 Sizes</span>
              <span className="font-dm text-[14px] font-bold text-white">
                {formatIndianRupeeExact(product.startingPrice)} –{' '}
                {formatIndianRupeeExact(product.maxPrice)}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 5: COMPARE SIMILAR MATTRESSES */}
      <section className="max-w-[1480px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex items-end justify-between mb-8">
          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0F62C8]">
              EXPLORE RELATED CATALOGUE MODELS
            </span>
            <h2 className="font-dm text-[22px] sm:text-3xl font-semibold text-[#0A2E73] leading-[1.3] mt-1">
              Compare Similar Mattresses
            </h2>
          </div>
          <button
            type="button"
            onClick={() => navigateToMattresses('all')}
            className="text-[14px] font-semibold text-[#0A2E73] hover:text-[#0F62C8] flex items-center gap-1.5 cursor-pointer"
          >
            <span>View All 14 Models</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {similarProducts.map((sim) => (
            <div
              key={sim.id}
              className="bg-white rounded-3xl border border-[#E2E8F0] overflow-hidden shadow-sm hover:shadow-xl transition-all flex flex-col"
            >
              <div className="aspect-[4/3] bg-[#F8FAFC] relative overflow-hidden">
                <img
                  src={sim.images.hero}
                  alt={sim.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-[#0A2E73]/90 text-white text-[12px] font-medium">
                  {sim.warrantyMonths}M Warranty
                </span>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-[#0F62C8]">
                    Page {sim.pageNumber} • {sim.category}
                  </span>
                  <h3 className="font-dm text-[22px] font-semibold text-[#0A2E73] leading-[1.3] mt-0.5">
                    {sim.name}
                  </h3>
                  <p className="text-[14px] font-normal leading-[1.6] text-[#475569] mt-1">{sim.tagline}</p>
                </div>
                <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-semibold tracking-[0.04em] text-[#64748B] uppercase block">Starting MRP</span>
                    <span className="font-dm text-[22px] font-bold text-[#0A2E73]">
                      {formatIndianRupeeExact(sim.startingPrice)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigateToProduct(sim.slug)}
                    className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#0E3B91] text-white text-[14px] font-semibold cursor-pointer"
                  >
                    View Model
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* HIGH-RES IMAGE LIGHTBOX MODAL */}
      {isLightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-8"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div
            className="relative max-w-5xl w-full bg-[#F8FAFC] rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-[#0A2E73] text-white">
              <div>
                <h4 className="font-dm text-[22px] font-semibold leading-[1.3]">{product.name}</h4>
                <p className="text-[14px] font-normal leading-[1.6] text-white/75">{galleryItems[activeImageIdx]?.caption}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsLightboxOpen(false)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 sm:p-6 max-h-[80vh] overflow-auto flex items-center justify-center bg-[#F8FAFC]">
              <img
                src={galleryItems[activeImageIdx]?.url}
                alt={galleryItems[activeImageIdx]?.caption}
                className="max-w-full max-h-[72vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}

      {/* ENQUIRY MODAL */}
      {isEnquiryOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setIsEnquiryOpen(false)}
        >
          <div
            className="max-w-md w-full bg-white rounded-3xl border border-[#E2E8F0] shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#0A2E73] text-white px-6 py-5 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-[0.04em] text-white block">
                  DIRECT PRODUCT ENQUIRY
                </span>
                <h3 className="font-dm text-[22px] font-semibold leading-[1.3] mt-0.5">{product.name}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEnquiryOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {enquirySubmitted ? (
              <div className="p-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-dm text-[22px] font-semibold text-[#0A2E73] leading-[1.3]">
                  Enquiry Recorded
                </h4>
                <p className="text-[14px] font-normal leading-[1.6] text-[#475569]">
                  We have saved your configuration for{' '}
                  <strong>
                    {product.name} ({activeSizeMeta.sizeInches}" × {selectedThickness}")
                  </strong>{' '}
                  at MRP {activeVariant ? formatIndianRupeeExact(activeVariant.mrp) : ''}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleEnquirySubmit} className="p-6 space-y-4">
                <div className="rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] p-3 text-[12px] font-medium space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#475569]">Selected Variant:</span>
                    <strong className="text-[#0A2E73]">
                      {activeSizeMeta.sizeInches}" ({activeSizeMeta.sizeFeet} ft) × {selectedThickness}"
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#475569]">Catalogue MRP:</span>
                    <strong className="font-semibold text-[#0A2E73]">
                      {activeVariant ? formatIndianRupeeExact(activeVariant.mrp) : ''} (Qty: {quantity})
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#0A2540] block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={enquiryForm.name}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, name: e.target.value })}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0A2E73]"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#0A2540] block mb-1">
                    Phone / WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={enquiryForm.phone}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0A2E73]"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-medium text-[#0A2540] block mb-1">
                    Delivery City / Pincode
                  </label>
                  <input
                    type="text"
                    value={enquiryForm.city}
                    onChange={(e) => setEnquiryForm({ ...enquiryForm, city: e.target.value })}
                    placeholder="City or Pincode"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] text-[14px] focus:outline-none focus:border-[#0A2E73]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#0A2E73] hover:bg-[#0E3B91] text-white font-semibold text-[14px] cursor-pointer"
                >
                  Submit Variant Enquiry
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </article>
  );
};
