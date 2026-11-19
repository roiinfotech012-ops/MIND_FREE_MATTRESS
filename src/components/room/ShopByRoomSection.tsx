import React, { useState } from 'react';
import { ArrowRight, Heart, Eye, Star, Snowflake } from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import { useCart } from '../../context/CartContext';
import { useHomePageContent } from '../../context/HomePageContentContext';
import { ScrollReveal } from '../motion/ScrollReveal';

interface RoomShowcaseItem {
  id: 'master' | 'guest' | 'kids' | 'studio';
  name: string;
  roomImage: string;
  product: {
    id: string;
    slug: string;
    badgeLabel: string;
    badgeLines: [string, string];
    name: string;
    description: string;
    image: string;
    rating: string;
    reviewsCount: string;
    mrpFormatted: string;
    priceFormatted: string;
    discountLabel: string;
  };
}

const ROOM_SHOWCASE_DATA: RoomShowcaseItem[] = [
  {
    id: 'master',
    name: 'Master Bedroom',
    roomImage: '/images/rooms/room-master.jpg',
    product: {
      id: 'cool-active-ortho-plus',
      slug: 'cool-active-ortho-plus',
      badgeLabel: 'BESTSELLER',
      badgeLines: ['Cool', 'Comfort'],
      name: 'Cool Active Ortho Plus Mattress',
      description: 'Advanced cooling comfort with orthopedic support for a refreshing sleep.',
      image: '/images/rooms/room-bestseller-ortho.jpg',
      rating: '4.8/5',
      reviewsCount: '1,240 reviews',
      mrpFormatted: '₹49,998',
      priceFormatted: '₹37,998',
      discountLabel: '24% OFF',
    },
  },
  {
    id: 'guest',
    name: 'Guest Room',
    roomImage: '/images/rooms/room-guest.jpg',
    product: {
      id: 'ultima-pocket-spring',
      slug: 'ultima-pocket-spring',
      badgeLabel: 'HOTEL LUXURY',
      badgeLines: ['Plush', 'Support'],
      name: 'Ultima Pocket Spring Mattress',
      description: 'Independent pocket springs with plush Euro-top comfort for welcoming every guest.',
      image: '/images/products/product-dream-comfort.jpg',
      rating: '4.9/5',
      reviewsCount: '980 reviews',
      mrpFormatted: '₹43,998',
      priceFormatted: '₹32,998',
      discountLabel: '25% OFF',
    },
  },
  {
    id: 'kids',
    name: 'Kids Room',
    roomImage: '/images/rooms/room-kids.jpg',
    product: {
      id: 'active-cool-spine-care',
      slug: 'active-cool-spine-care',
      badgeLabel: 'GROWING SPINE',
      badgeLines: ['Spine', 'Care'],
      name: 'Active Cool Spine Care Mattress',
      description: 'Hypoallergenic breathable fabric with ergonomic spinal support for growing bodies.',
      image: '/images/products/product-spine-care.jpg',
      rating: '4.8/5',
      reviewsCount: '845 reviews',
      mrpFormatted: '₹37,998',
      priceFormatted: '₹28,998',
      discountLabel: '24% OFF',
    },
  },
  {
    id: 'studio',
    name: 'Comfort Studio',
    roomImage: '/images/rooms/room-studio.jpg',
    product: {
      id: 'ultra-latex-plus',
      slug: 'ultra-latex-plus',
      badgeLabel: 'STUDIO PICK',
      badgeLines: ['Pure', 'Latex'],
      name: 'Ultra Latex Plus Mattress',
      description: 'Responsive organic latex & high-resilience foam crafted for modern studio living.',
      image: '/images/products/product-cool-latex-plus.jpg',
      rating: '4.9/5',
      reviewsCount: '1,120 reviews',
      mrpFormatted: '₹53,998',
      priceFormatted: '₹40,998',
      discountLabel: '24% OFF',
    },
  },
];

export const ShopByRoomSection: React.FC = () => {
  const { homePageData } = useHomePageContent();
  const roomsList =
    homePageData.shopByRoom.rooms.length > 0 ? homePageData.shopByRoom.rooms : ROOM_SHOWCASE_DATA;
  const [activeRoomId, setActiveRoomId] = useState<RoomShowcaseItem['id']>('master');
  const { navigateToProduct } = useNavigation();
  const { wishlist, toggleWishlist } = useCart();

  const activeRoom =
    roomsList.find((room) => room.id === activeRoomId) || roomsList[0];
  const isWishlisted = wishlist.includes(activeRoom.product.id);

  return (
    <section
      id="shop-by-room"
      className="relative w-full overflow-hidden bg-gradient-to-br from-[#EDF4FC] via-[#F6FAFE] to-[#E6F0FA] py-6 sm:py-8 lg:py-9 select-none border-b border-[#E2E8F0]"
      aria-label="Shop Mattresses by Room"
    >
      {/* Top-Left Diagonal Soft Geometric Shape */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.2) 42%, rgba(219,234,254,0.45) 100%)',
        }}
      />

      {/* Top-Right Decorative Navy & Red Corner Swoosh */}
      <div className="hidden sm:block absolute -top-10 -right-10 w-32 h-32 pointer-events-none z-0">
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="145" cy="45" r="95" fill="#0B2D6E" />
          <circle cx="175" cy="25" r="65" fill="#E31E24" />
        </svg>
      </div>

      {/* Bottom-Left Decorative Red & Navy Corner Swoosh */}
      <div className="hidden sm:block absolute -bottom-12 -left-10 w-44 h-32 pointer-events-none z-0">
        <svg viewBox="0 0 240 160" className="w-full h-full">
          <ellipse cx="45" cy="145" rx="135" ry="95" fill="#E31E24" />
          <ellipse cx="15" cy="160" rx="105" ry="75" fill="#0B2D6E" />
        </svg>
      </div>

      {/* Right-Edge Decorative Red Accent Arc */}
      <div className="hidden xl:block absolute right-0 top-1/2 -translate-y-1/4 w-7 h-40 pointer-events-none z-0 overflow-hidden">
        <div className="w-20 h-40 rounded-l-full bg-[#E31E24]" />
      </div>

      {/* Bottom-Right Subtle Decorative Dot Grid */}
      <div className="hidden lg:grid grid-cols-5 gap-2.5 absolute bottom-3.5 right-8 pointer-events-none z-0 opacity-45">
        {Array.from({ length: 10 }).map((_, idx) => (
          <span key={idx} className="w-1 h-1 rounded-full bg-[#1E4B8F]" />
        ))}
      </div>

      <div className="relative z-10 max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 space-y-4 sm:space-y-5">
        {/* 1. TOP HEADER ROW: Title on Left + 3 Feature Icons on Right */}
        <ScrollReveal variant="fade-up" duration={700}>
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            {/* Left: Eyebrow & "SHOP BY ROOM" */}
            <div>
              <div className="flex items-center gap-1.5 mb-1">
                <span className="w-5 h-[2.5px] rounded-full bg-[#0A2558]" />
                <span className="w-4 h-[2.5px] rounded-full bg-[#E31E24]" />
                <span className="text-[10.5px] sm:text-[11.5px] font-medium tracking-[0.2em] text-[#1E3A5F] uppercase ml-1">
                  {homePageData.shopByRoom.eyebrow}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold tracking-tight leading-none">
                <span className="text-[#0A2558]">{homePageData.shopByRoom.titlePart1}</span>
                <span className="text-[#E31E24]">{homePageData.shopByRoom.titlePart2}</span>
              </h2>
            </div>

            {/* Right: 3 Trust Value Props in a Single Row on All Screen Sizes */}
            <div className="grid grid-cols-3 sm:flex sm:flex-nowrap items-center gap-2 sm:gap-5 lg:gap-6 w-full lg:w-auto">
              {/* Prop 1: Designed for Every Space */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 shrink-0" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M7 18V12C7 10.3431 8.34315 9 10 9H30C31.6569 9 33 10.3431 33 12V18"
                    stroke="#0A2558"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <rect x="11" y="13" width="7" height="5" rx="1.5" stroke="#0A2558" strokeWidth="2" />
                  <rect x="22" y="13" width="7" height="5" rx="1.5" stroke="#0A2558" strokeWidth="2" />
                  <path
                    d="M5 21C5 19.3431 6.34315 18 8 18H32C33.6569 18 35 19.3431 35 21V27H5V21Z"
                    stroke="#E31E24"
                    strokeWidth="2.4"
                  />
                  <path d="M7 27V31M33 27V31" stroke="#E31E24" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
                <div className="text-[9.5px] sm:text-[12px] leading-[1.2] sm:leading-[1.25] text-[#0A2558] min-w-0">
                  <div className="font-semibold truncate">Designed</div>
                  <div className="font-normal text-[#1E3A5F] truncate">for Every Space</div>
                </div>
              </div>

              <span className="hidden sm:inline-block h-7 w-[1px] bg-[#94A3B8]/50 shrink-0" />

              {/* Prop 2: Better Sleep Every Day */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 shrink-0" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M6 19L20 7L34 19"
                    stroke="#E31E24"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 17V31C10 32.1046 10.8954 33 12 33H28C29.1046 33 30 32.1046 30 31V17"
                    stroke="#0A2558"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                  />
                  <rect x="17" y="23" width="6" height="10" rx="1" stroke="#0A2558" strokeWidth="2.2" />
                </svg>
                <div className="text-[9.5px] sm:text-[12px] leading-[1.2] sm:leading-[1.25] text-[#0A2558] min-w-0">
                  <div className="font-semibold truncate">Better Sleep</div>
                  <div className="font-normal text-[#1E3A5F] truncate">Every Day</div>
                </div>
              </div>

              <span className="hidden sm:inline-block h-7 w-[1px] bg-[#94A3B8]/50 shrink-0" />

              {/* Prop 3: Premium Comfort For Every Home */}
              <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                <svg className="w-5 h-5 sm:w-7 sm:h-7 shrink-0" viewBox="0 0 40 40" fill="none">
                  <path
                    d="M20 6L31 10.5V19.5C31 26.8 26.2 32.4 20 35C13.8 32.4 9 26.8 9 19.5V10.5L20 6Z"
                    stroke="#0A2558"
                    strokeWidth="2.4"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M15.5 20.5L18.8 23.8L25 16.5"
                    stroke="#E31E24"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-[9.5px] sm:text-[12px] leading-[1.2] sm:leading-[1.25] text-[#0A2558] min-w-0">
                  <div className="font-semibold truncate">Premium Comfort</div>
                  <div className="font-normal text-[#1E3A5F] truncate">For Every Home</div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        {/* 2. MAIN 3-COLUMN SHOWCASE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 xl:gap-5 items-stretch">
          {/* COLUMN 1 (Left): 4 Room Thumbnails */}
          <ScrollReveal variant="slide-left" delay={80} className="lg:col-span-2">
            <div className="h-full grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-1 gap-2.5 flex-col justify-between">
              {roomsList.map((room) => {
                const isSelected = room.id === activeRoomId;
                return (
                  <button
                    key={room.id}
                    type="button"
                    onClick={() => setActiveRoomId(room.id)}
                    className="group text-left focus:outline-none cursor-pointer active:scale-97 transition-transform duration-200"
                  >
                    <div
                      className={`relative h-[64px] sm:h-[68px] lg:h-[66px] xl:h-[70px] w-full rounded-[11px] overflow-hidden transition-all duration-300 ${
                        isSelected
                          ? 'ring-[2px] ring-[#E31E24] shadow-[0_8px_18px_rgba(227,30,36,0.26)] -translate-y-0.5'
                          : 'ring-1 ring-white/80 shadow-[0_3px_10px_rgba(10,37,88,0.08)] opacity-90 hover:opacity-100 hover:-translate-y-0.5 hover:ring-[#0A2558]/40'
                      }`}
                    >
                      <img
                        src={room.roomImage}
                        alt={room.name}
                        className={`w-full h-full ${
                          room.roomImage?.startsWith('data:image/')
                            ? 'object-contain bg-white'
                            : 'object-cover'
                        }`}
                      />
                    </div>
                    <div
                      className={`mt-1 text-[11.5px] sm:text-[12px] font-bold leading-tight transition-colors ${
                        isSelected
                          ? 'text-[#0A2558]'
                          : 'text-[#0A2558]/85 group-hover:text-[#E31E24]'
                      }`}
                    >
                      {room.name}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollReveal>

          {/* COLUMN 2 (Center): Large Featured Room Scene + Bottom Navy Pill Bar */}
          <ScrollReveal variant="scale-up" delay={140} className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-full h-[240px] sm:h-[300px] lg:h-[340px] xl:h-[355px] rounded-[18px] overflow-hidden bg-[#0A2558] shadow-[0_16px_38px_rgba(10,37,88,0.16)] border-2 border-white group">
              {roomsList.map((room) => (
                <img
                  key={room.id}
                  src={room.roomImage}
                  alt={room.name}
                  className={`absolute inset-0 w-full h-full ${
                    room.roomImage?.startsWith('data:image/')
                      ? 'object-contain bg-white'
                      : 'object-cover'
                  } transition-opacity duration-500 ${
                    room.id === activeRoomId
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0 pointer-events-none'
                  }`}
                />
              ))}
              {/* Subtle Bottom Ambient Vignette */}
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#07214A]/45 to-transparent pointer-events-none z-15" />
            </div>

            {/* Overlapping Bottom Navy Room Selector Pill Bar */}
            <div className="relative z-20 -mt-5 w-[96%] sm:w-[88%] bg-[#07214A]/95 backdrop-blur-md border border-white/15 rounded-full p-1 shadow-[0_12px_28px_rgba(7,33,74,0.34)] flex items-center justify-between overflow-x-auto no-scrollbar">
              {roomsList.map((room, index) => {
                const isSelected = room.id === activeRoomId;
                return (
                  <React.Fragment key={room.id}>
                    <button
                      type="button"
                      onClick={() => setActiveRoomId(room.id)}
                      className={`flex-1 min-h-[42px] sm:min-h-[44px] py-1.5 px-2.5 sm:px-4 rounded-full text-[11px] sm:text-[12.5px] whitespace-nowrap active:scale-95 transition-all duration-200 cursor-pointer flex items-center justify-center ${
                        isSelected
                          ? 'bg-white text-[#E31E24] font-bold shadow-xs'
                          : 'text-white/90 hover:text-white font-medium'
                      }`}
                    >
                      {room.name}
                    </button>
                    {index < roomsList.length - 1 && !isSelected && (
                      <span className="h-3.5 w-[1px] bg-white/20 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </ScrollReveal>

          {/* COLUMN 3 (Right): Featured Bestseller Product Card (Left Image + Right Content on Mobile, Vertical on Tablet/Desktop) */}
          <ScrollReveal variant="slide-right" delay={200} className="lg:col-span-4 w-full">
            <div className="bg-white/95 backdrop-blur-md rounded-[20px] p-3.5 sm:p-4.5 shadow-[0_14px_34px_rgba(10,37,88,0.09)] hover:shadow-[0_22px_48px_rgba(10,37,88,0.15)] hover:-translate-y-1 transition-all duration-300 border border-white flex flex-row sm:flex-col gap-3.5 sm:gap-0 justify-between h-full items-stretch">
              {/* Left on Mobile / Top on Tablet & Desktop: Product Visual Container */}
              <div
                onClick={() => navigateToProduct(activeRoom.product.slug)}
                className="relative w-[42%] sm:w-full shrink-0 rounded-[14px] bg-gradient-to-b from-[#EEF5FC] via-[#F5F9FE] to-white pt-2.5 sm:pt-3 pb-1.5 px-2 sm:px-2.5 overflow-hidden cursor-pointer group flex flex-col justify-between"
              >
                {/* Top-Left BESTSELLER + Red Underline */}
                <div className="relative z-10 pl-0.5 sm:pl-1">
                  <span className="text-[9px] sm:text-[10.5px] font-semibold tracking-[0.16em] sm:tracking-[0.18em] text-[#1E293B] uppercase block">
                    {activeRoom.product.badgeLabel}
                  </span>
                  <span className="w-4 sm:w-5 h-[2px] bg-[#E31E24] block mt-1 rounded-full" />
                </div>

                {/* Top-Right Circular Crimson Badge */}
                <div className="absolute top-2 right-2 sm:top-2.5 sm:right-2.5 z-20 w-[40px] h-[40px] sm:w-[52px] sm:h-[52px] rounded-full bg-[#E31E24] text-white flex flex-col items-center justify-center shadow-[0_6px_14px_rgba(227,30,36,0.3)] text-center leading-tight">
                  <Snowflake className="w-3 h-3 sm:w-4 sm:h-4 text-white stroke-[2] mb-0.5" />
                  <span className="text-[7px] sm:text-[8.5px] font-semibold">
                    {activeRoom.product.badgeLines[0]}
                  </span>
                  <span className="text-[7px] sm:text-[8.5px] font-semibold">
                    {activeRoom.product.badgeLines[1]}
                  </span>
                </div>

                {/* Mattress Studio Cutout / Image */}
                <div className="mt-1.5 flex-1 min-h-[110px] sm:min-h-0 sm:h-[135px] xl:h-[140px] w-full rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                  <img
                    src={activeRoom.product.image}
                    alt={activeRoom.product.name}
                    className="max-w-full max-h-full w-auto h-auto object-contain"
                  />
                </div>
              </div>

              {/* Right on Mobile / Bottom on Tablet & Desktop: Product Info & Actions */}
              <div className="flex-1 min-w-0 sm:pt-3 flex flex-col justify-between space-y-1.5 sm:space-y-2">
                <h3
                  onClick={() => navigateToProduct(activeRoom.product.slug)}
                  className="text-[14px] sm:text-[17px] font-extrabold text-[#0A2558] hover:text-[#E31E24] leading-snug cursor-pointer transition-colors"
                >
                  {activeRoom.product.name}
                </h3>

                <p className="text-[11px] sm:text-[12px] text-[#334155] leading-snug line-clamp-2">
                  {activeRoom.product.description}
                </p>

                {/* Rating Row */}
                <div className="flex items-center flex-wrap gap-1 sm:gap-1.5">
                  <div className="flex items-center gap-0.5 text-[#E31E24]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="w-3 h-3 sm:w-3.5 sm:h-3.5 fill-[#E31E24] text-[#E31E24]" />
                    ))}
                  </div>
                  <span className="text-[10.5px] sm:text-[11.5px] font-medium text-[#475569]">
                    {activeRoom.product.rating} ({activeRoom.product.reviewsCount})
                  </span>
                </div>

                {/* Price & Discount Row */}
                <div className="flex items-center flex-wrap gap-1.5 sm:gap-2.5 pt-0.5">
                  <span className="text-[12.5px] sm:text-[14.5px] font-semibold text-[#94A3B8] line-through">
                    {activeRoom.product.mrpFormatted}
                  </span>
                  <span className="text-[17px] sm:text-[22px] font-extrabold text-[#E31E24] leading-none">
                    {activeRoom.product.priceFormatted}
                  </span>
                  <span className="px-2 sm:px-2.5 py-0.5 rounded-md bg-[#FDE2E4] text-[#E31E24] text-[10px] sm:text-[11px] font-bold">
                    {activeRoom.product.discountLabel}
                  </span>
                </div>

                {/* Bottom Action Row: Thumb-Friendly Shop Now + Wishlist + Eye (min 48px height) */}
                <div className="flex items-center gap-1.5 sm:gap-2 pt-1.5">
                  <button
                    type="button"
                    onClick={() => navigateToProduct(activeRoom.product.slug)}
                    className="flex-1 min-h-[48px] py-2.5 px-3.5 sm:px-5 rounded-full bg-[#E31E24] hover:bg-[#C8161D] active:scale-[0.98] text-white text-[12px] sm:text-[13px] font-bold shadow-[0_6px_16px_rgba(227,30,36,0.26)] hover:shadow-[0_10px_22px_rgba(227,30,36,0.34)] flex items-center justify-center gap-1.5 transition-all duration-200 cursor-pointer group whitespace-nowrap"
                  >
                    <span>Shop Now</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[2.4] transition-transform duration-200 group-hover:translate-x-1" />
                  </button>

                  <button
                    type="button"
                    onClick={() => toggleWishlist(activeRoom.product.id)}
                    className={`w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl border flex items-center justify-center shrink-0 active:scale-95 transition-all duration-200 cursor-pointer ${
                      isWishlisted
                        ? 'bg-[#FDE2E4] border-[#E31E24] text-[#E31E24]'
                        : 'bg-[#F4F7FB] hover:bg-[#E6EFFA] border-[#E2E8F0] text-[#0A2558]'
                    }`}
                    aria-label="Add to wishlist"
                  >
                    <Heart className={`w-4 h-4 ${isWishlisted ? 'fill-[#E31E24]' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={() => navigateToProduct(activeRoom.product.slug)}
                    className="w-12 h-12 min-w-[48px] min-h-[48px] rounded-2xl bg-[#F4F7FB] hover:bg-[#E6EFFA] border border-[#E2E8F0] text-[#0A2558] flex items-center justify-center shrink-0 active:scale-95 transition-all duration-200 cursor-pointer"
                    aria-label="View product details"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
};
