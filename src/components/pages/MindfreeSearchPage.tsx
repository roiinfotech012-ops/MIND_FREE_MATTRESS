import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  X,
  Star,
  ArrowRight,
  Heart,
  Compass,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useHomePageContent } from '../../context/HomePageContentContext';
import { MATTRESS_PRODUCTS } from '../../data/pdpData';
import { PILLOWS_CATALOGUE, ACCESSORIES_CATALOGUE } from '../../data/accessoriesData';

interface SearchItem {
  id: string;
  name: string;
  category: 'mattress' | 'pillow' | 'accessory';
  categoryLabel: string;
  tagline: string;
  price: number;
  originalPrice: number;
  image: string;
  rating: number;
  reviewsCount: number;
  slug?: string;
  sku: string;
  badge?: string;
}

export const MindfreeSearchPage: React.FC = () => {
  const { searchQuery: initialQuery, navigateToSearch, navigateToProduct } = useNavigation();
  const { addToCart, wishlist, toggleWishlist } = useCart();
  const { mattressesData, pillowsData } = useHomePageContent();

  const [query, setQuery] = useState(initialQuery || '');
  const [selectedType, setSelectedType] = useState<'all' | 'mattress' | 'pillow' | 'accessory'>('all');

  // Synchronize when URL query changes
  useEffect(() => {
    if (initialQuery !== null && initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Unified Catalogue Dataset (live-synced with Admin CMS)
  const allItems: SearchItem[] = useMemo(() => {
    const list: SearchItem[] = [];

    // 1. Mattresses (from live Admin CMS with fallback to static MATTRESS_PRODUCTS)
    if (mattressesData?.mattressModels && mattressesData.mattressModels.length > 0) {
      mattressesData.mattressModels.forEach((m) => {
        const staticRef = MATTRESS_PRODUCTS[m.id] || MATTRESS_PRODUCTS[m.slug];
        const basePrice = m.startingPrice || staticRef?.sizes?.[0]?.price || 8820;
        list.push({
          id: m.id,
          name: m.name,
          category: 'mattress',
          categoryLabel: m.printedCategoryLabel || m.category,
          tagline: m.tagline,
          price: basePrice,
          originalPrice: Math.round(basePrice * 1.18),
          image: m.images?.hero || staticRef?.gallery?.[0]?.url || '/images/type_ortho.png',
          rating: staticRef?.rating || 4.9,
          reviewsCount: staticRef?.reviewsCount || 240,
          slug: m.slug,
          sku: staticRef?.sizes?.[0]?.sku || `MF-${m.slug.toUpperCase()}`,
          badge: m.catalogueBadges?.[0] || staticRef?.badge,
        });
      });
    } else {
      Object.values(MATTRESS_PRODUCTS).forEach((m) => {
        const queenSize = m.sizes[2] || m.sizes[0];
        if (!queenSize) return;
        list.push({
          id: m.id,
          name: m.name,
          category: 'mattress',
          categoryLabel: m.category,
          tagline: m.tagline,
          price: queenSize.price,
          originalPrice: queenSize.originalPrice,
          image: m.gallery?.[0]?.url || '/images/type_ortho.png',
          rating: m.rating,
          reviewsCount: m.reviewsCount,
          slug: m.slug,
          sku: queenSize.sku,
          badge: m.badge,
        });
      });
    }

    // 2. Pillows (from live Admin CMS with fallback to static PILLOWS_CATALOGUE)
    const livePillows =
      pillowsData?.pillowModels && pillowsData.pillowModels.length > 0
        ? pillowsData.pillowModels
        : PILLOWS_CATALOGUE;

    livePillows.forEach((p) => {
      const baseSize = p.sizes?.[0];
      if (!baseSize) return;
      list.push({
        id: p.id,
        name: p.name,
        category: 'pillow',
        categoryLabel: 'Ergonomic Pillows',
        tagline: p.tagline,
        price: baseSize.price,
        originalPrice: p.originalPrice,
        image: p.image,
        rating: p.rating,
        reviewsCount: p.reviewsCount,
        sku: baseSize.sku,
        badge: p.badge,
      });
    });

    // 3. Accessories
    ACCESSORIES_CATALOGUE.forEach((a) => {
      list.push({
        id: a.id,
        name: a.name,
        category: 'accessory',
        categoryLabel: 'Bedding Sanctuary',
        tagline: a.tagline,
        price: a.sizes[0].price,
        originalPrice: a.originalPrice,
        image: a.image,
        rating: a.rating,
        reviewsCount: a.reviewsCount,
        sku: a.sizes[0].sku,
        badge: a.badge,
      });
    });

    return list;
  }, [mattressesData, pillowsData]);

  // Filtered results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    let res = allItems;

    if (selectedType !== 'all') {
      res = res.filter((item) => item.category === selectedType);
    }

    if (!q) return res;

    return res.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.tagline.toLowerCase().includes(q) ||
        item.categoryLabel.toLowerCase().includes(q) ||
        (item.badge && item.badge.toLowerCase().includes(q))
    );
  }, [allItems, query, selectedType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateToSearch(query);
  };

  const handleQuickAdd = (item: SearchItem) => {
    addToCart(
      {
        id: item.id,
        sku: item.sku,
        name: item.name,
        size: item.category === 'mattress' ? 'Queen (78" × 60")' : 'Standard Spec',
        thickness: 'Atelier Spec',
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
      },
      1
    );
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* 1. SEARCH HEADER */}
      <section className="bg-white border-b border-[#E2E8F0] pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1520px] mx-auto max-w-3xl space-y-4">
          <div className="text-center space-y-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E3262E] font-bold">
              Mindfree Sleep Catalogue
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#071F52]">
              Search Mattresses & Bedding Sanctuary
            </h1>
          </div>

          {/* Search Input Bar */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                navigateToSearch(e.target.value);
              }}
              placeholder="Search by posture, material (latex, memory foam, pocket spring), or product name..."
              className="w-full pl-12 pr-10 py-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm text-[#071F52] focus:outline-none focus:border-[#0A2E73] focus:ring-2 focus:ring-[#0A2E73]/10 transition-all shadow-inner"
            />
            <Search className="w-5 h-5 text-[#64748B] absolute left-4 top-1/2 -translate-y-1/2" />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  navigateToSearch('');
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0A2E73] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Quick Filter Keywords */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <span className="text-xs text-[#64748B]">Popular searches:</span>
            {['Orthopedic', 'Organic Latex', 'Memory Foam', 'Cooling Gel', 'Waterproof Bamboo', 'Mulberry Silk'].map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => {
                  setQuery(term);
                  navigateToSearch(term);
                }}
                className="px-2.5 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#DBEAFE] border border-[#E2E8F0] text-xs font-medium text-[#0F2952] transition-colors cursor-pointer"
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORY TABS & RESULTS COUNT */}
      <section className="sticky top-[66px] sm:top-[72px] z-20 bg-[#F8FAFC]/95 backdrop-blur-md border-b border-[#E2E8F0] py-3 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1520px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {[
              { id: 'all', label: 'All Items' },
              { id: 'mattress', label: 'Mattresses' },
              { id: 'pillow', label: 'Pillows' },
              { id: 'accessory', label: 'Accessories' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedType(tab.id as any)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                  selectedType === tab.id
                    ? 'bg-[#0A2E73] text-white shadow-2xs'
                    : 'bg-white text-[#64748B] hover:text-[#0A2E73] border border-[#E2E8F0]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <p className="text-xs text-[#64748B]">
            Found <span className="font-bold text-[#0A2E73]">{filteredResults.length}</span> matching products
            {query && (
              <span>
                {' '}
                for "<span className="font-semibold text-[#071F52]">{query}</span>"
              </span>
            )}
          </p>
        </div>
      </section>

      {/* 3. RESULTS GRID */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredResults.length === 0 ? (
          <div className="text-center py-16 space-y-4 bg-white rounded-3xl border border-[#E2E8F0] p-8 max-w-xl mx-auto shadow-xs">
            <Compass className="w-10 h-10 text-[#E3262E] mx-auto" />
            <h3 className="font-serif text-xl font-bold text-[#071F52]">
              No exact matches found for "{query}"
            </h3>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Try searching with broader terms such as "spine", "latex", "soft", or explore our
              certified collections directly.
            </p>
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedType('all');
                navigateToSearch('');
              }}
              className="mt-2 px-5 py-2.5 rounded-xl bg-[#0A2E73] text-white text-xs font-semibold cursor-pointer"
            >
              Clear Search & Show All
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResults.map((item) => {
              const isSaved = wishlist.includes(item.id);

              return (
                <div
                  key={item.id}
                  className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#E3262E]/50 shadow-xs hover:shadow-[0_16px_40px_rgba(10,46,115,0.08)] transition-all flex flex-col overflow-hidden group"
                >
                  {/* Photo */}
                  <div className="relative h-60 bg-white overflow-hidden flex items-center justify-center p-2">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="max-w-full max-h-full w-auto h-auto object-contain"
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

                    <div className="absolute bottom-3 left-3">
                      <span className="px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-white text-[10px] font-mono">
                        {item.categoryLabel}
                      </span>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-xs font-bold text-[#0F2952]">{item.rating}</span>
                        <span className="text-[11px] text-[#64748B]">
                          ({item.reviewsCount} reviews)
                        </span>
                      </div>

                      <h3
                        onClick={() => {
                          if (item.category === 'mattress' && item.slug) {
                            navigateToProduct(item.slug);
                          }
                        }}
                        className={`font-serif text-lg font-bold text-[#071F52] group-hover:text-[#0A2E73] leading-snug transition-colors ${
                          item.category === 'mattress' ? 'cursor-pointer' : ''
                        }`}
                      >
                        {item.name}
                      </h3>

                      <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                        {item.tagline}
                      </p>
                    </div>

                    {/* Price and CTA */}
                    <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                      <div className="flex items-baseline justify-between">
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-xl font-serif font-bold text-[#0A2E73]">
                              ₹{item.price.toLocaleString('en-IN')}
                            </span>
                            <span className="text-xs text-[#64748B] line-through">
                              ₹{item.originalPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                        </div>

                        <span className="text-[10.5px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                          Save ₹{(item.originalPrice - item.price).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {item.category === 'mattress' && item.slug ? (
                          <button
                            type="button"
                            onClick={() => navigateToProduct(item.slug!)}
                            className="py-2.5 px-3 rounded-xl border border-[#0A2E73] text-[#0A2E73] hover:bg-[#DBEAFE] text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <span>Specs</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <div />
                        )}

                        <button
                          type="button"
                          onClick={() => handleQuickAdd(item)}
                          className={`${
                            item.category === 'mattress' ? 'col-span-1' : 'col-span-2'
                          } py-2.5 px-4 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white text-xs font-semibold tracking-wide transition-colors cursor-pointer shadow-xs text-center`}
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
        )}
      </section>
    </div>
  );
};
