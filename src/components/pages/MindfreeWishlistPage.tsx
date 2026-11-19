import React, { useMemo } from 'react';
import {
  Heart,
  Trash2,
  ShoppingBag,
  ArrowRight,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useHomePageContent } from '../../context/HomePageContentContext';
import { MATTRESS_PRODUCTS } from '../../data/pdpData';
import { PILLOWS_CATALOGUE, ACCESSORIES_CATALOGUE } from '../../data/accessoriesData';

export const MindfreeWishlistPage: React.FC = () => {
  const { navigateToMattresses, navigateToProduct } = useNavigation();
  const { wishlist, toggleWishlist, addToCart, openCart } = useCart();
  const { mattressesData, pillowsData } = useHomePageContent();

  // Match wishlisted IDs with products across mattresses, pillows, accessories
  const wishlistedItems = useMemo(() => {
    const results: {
      id: string;
      name: string;
      category: string;
      price: number;
      originalPrice: number;
      image: string;
      sku: string;
      size: string;
      slug?: string;
      tagline: string;
    }[] = [];

    const liveMattressList = mattressesData?.mattressModels || [];
    const livePillows =
      pillowsData?.pillowModels && pillowsData.pillowModels.length > 0
        ? pillowsData.pillowModels
        : PILLOWS_CATALOGUE;

    wishlist.forEach((id) => {
      // Check Mattresses (live Admin CMS or static)
      const cmsMattress = liveMattressList.find((item) => item.id === id || item.slug === id);
      const staticMattress = MATTRESS_PRODUCTS[id];
      if (cmsMattress || staticMattress) {
        const queen = staticMattress ? staticMattress.sizes[2] || staticMattress.sizes[0] : undefined;
        const price = cmsMattress?.startingPrice || queen?.price || 8820;
        results.push({
          id: cmsMattress?.id || staticMattress.id,
          name: cmsMattress?.name || staticMattress.name,
          category: cmsMattress?.printedCategoryLabel || cmsMattress?.category || staticMattress.category,
          price,
          originalPrice: queen?.originalPrice || Math.round(price * 1.18),
          image: cmsMattress?.images?.hero || staticMattress?.gallery?.[0]?.url || '/images/type_ortho.png',
          sku: queen?.sku || `MF-${(cmsMattress?.slug || id).toUpperCase()}`,
          size: queen?.label || `72" x 36" (${cmsMattress?.thicknessOptions?.[0] || 6}" Thick)`,
          slug: cmsMattress?.slug || staticMattress?.slug,
          tagline: cmsMattress?.tagline || staticMattress.tagline,
        });
        return;
      }

      // Check Pillows (live Admin CMS or static)
      const pillow = livePillows.find((p) => p.id === id) || PILLOWS_CATALOGUE.find((p) => p.id === id);
      if (pillow && pillow.sizes?.[0]) {
        results.push({
          id: pillow.id,
          name: pillow.name,
          category: 'Ergonomic Pillows',
          price: pillow.sizes[0].price,
          originalPrice: pillow.originalPrice,
          image: pillow.image,
          sku: pillow.sizes[0].sku,
          size: pillow.sizes[0].label,
          tagline: pillow.tagline,
        });
        return;
      }

      // Check Accessories
      const acc = ACCESSORIES_CATALOGUE.find((a) => a.id === id);
      if (acc) {
        results.push({
          id: acc.id,
          name: acc.name,
          category: 'Bedding Sanctuary',
          price: acc.sizes[0].price,
          originalPrice: acc.originalPrice,
          image: acc.image,
          sku: acc.sizes[0].sku,
          size: acc.sizes[0].label,
          tagline: acc.tagline,
        });
      }
    });

    return results;
  }, [wishlist, mattressesData, pillowsData]);

  const handleMoveToCart = (item: (typeof wishlistedItems)[0]) => {
    addToCart(
      {
        id: item.id,
        sku: item.sku,
        name: item.name,
        size: item.size,
        thickness: 'Atelier Spec',
        price: item.price,
        originalPrice: item.originalPrice,
        image: item.image,
      },
      1
    );
  };

  const handleMoveAllToCart = () => {
    wishlistedItems.forEach((item) => {
      addToCart(
        {
          id: item.id,
          sku: item.sku,
          name: item.name,
          size: item.size,
          thickness: 'Atelier Spec',
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image,
        },
        1
      );
    });
    openCart();
  };

  return (
    <div className="bg-[#F8FAFC] min-h-screen">
      {/* 1. HERO HEADER */}
      <section className="bg-white border-b border-[#E2E8F0] pt-12 pb-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1520px] mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#E3262E] font-bold">
              <Heart className="w-3.5 h-3.5 fill-[#E3262E]" />
              <span>Saved Sleep Sanctuary</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#071F52]">
              Your Wishlist Sanctuary ({wishlistedItems.length})
            </h1>
            <p className="text-xs text-[#64748B]">
              Items saved across your browsing session are stored securely on this device.
            </p>
          </div>

          {wishlistedItems.length > 0 && (
            <button
              type="button"
              onClick={handleMoveAllToCart}
              className="px-6 py-3 rounded-2xl bg-[#0A2E73] hover:bg-[#071F52] text-white text-xs font-semibold tracking-wide transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Move All to Bag</span>
            </button>
          )}
        </div>
      </section>

      {/* 2. MAIN WISHLIST GRID OR EMPTY STATE */}
      <section className="max-w-[1520px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {wishlistedItems.length === 0 ? (
          <div className="text-center py-16 space-y-5 bg-white rounded-3xl border border-[#E2E8F0] p-8 max-w-xl mx-auto shadow-xs">
            <div className="w-16 h-16 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] text-[#E3262E] flex items-center justify-center mx-auto">
              <Heart className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="font-serif text-2xl font-bold text-[#071F52]">
                Your Wishlist is Quiet
              </h3>
              <p className="text-xs text-[#64748B] max-w-sm mx-auto leading-relaxed">
                Click the heart icon on any mattress, ergonomic pillow, or silk bedding item to
                preserve it here for future consideration.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigateToMattresses()}
              className="mt-2 px-6 py-3 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white text-xs font-semibold tracking-wide transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <span>Explore Signature Mattresses</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {wishlistedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-[#E2E8F0] hover:border-[#E3262E]/50 overflow-hidden shadow-xs hover:shadow-[0_16px_40px_rgba(10,46,115,0.08)] transition-all flex flex-col group"
              >
                {/* Image */}
                <div className="relative h-60 bg-white overflow-hidden flex items-center justify-center p-2">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0A2E73] text-[#F8FAFC] text-[9.5px] font-bold uppercase tracking-wider">
                      {item.category}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(item.id)}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-rose-600 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                    title="Remove from Wishlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Details */}
                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h3
                      onClick={() => {
                        if (item.slug) navigateToProduct(item.slug);
                      }}
                      className={`font-serif text-lg font-bold text-[#071F52] group-hover:text-[#0A2E73] transition-colors ${
                        item.slug ? 'cursor-pointer' : ''
                      }`}
                    >
                      {item.name}
                    </h3>
                    <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                      {item.tagline}
                    </p>
                    <span className="text-[11px] font-mono text-[#64748B] block">
                      Size: {item.size}
                    </span>
                  </div>

                  <div className="pt-3 border-t border-[#E2E8F0] space-y-3">
                    <div className="flex items-baseline justify-between">
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-xl font-serif font-bold text-[#0A2E73]">
                          ₹{item.price.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-[#64748B] line-through">
                          ₹{item.originalPrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                        Save ₹{(item.originalPrice - item.price).toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => toggleWishlist(item.id)}
                        className="py-2.5 px-3 rounded-xl border border-[#E2E8F0] text-[#64748B] hover:text-rose-600 hover:border-rose-300 text-xs font-semibold transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMoveToCart(item)}
                        className="py-2.5 px-4 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white text-xs font-semibold tracking-wide transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Move to Bag</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
