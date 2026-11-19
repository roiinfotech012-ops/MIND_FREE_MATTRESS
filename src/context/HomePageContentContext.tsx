import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { HERO_SLIDES, type HeroSlideData } from '../data/heroData';
import {
  MATTRESS_CATEGORIES,
  CORE_MATERIALS,
  TOP_DESIGNS,
  type MattressCategory,
  type CoreMaterial,
  type TopDesign,
} from '../data/navigationData';
import {
  BED_PRICE_CATALOGUE_PRODUCTS,
  CATALOGUE_CATEGORIES,
  type CatalogueCategoryId,
  type CatalogueMattressProduct,
} from '../data/bedPriceCatalogueData';
import { PILLOWS_CATALOGUE, type AccessoryItem } from '../data/accessoriesData';
import {
  fetchSiteContentFromPg,
  saveSiteContentToPg,
  fetchProductsFromPg,
  type PgProductRecord,
} from '../services/postgresApi';

export interface HeroFeatureStripItem {
  id: string;
  titleAccent: string;
  titleMain: string;
  subtitle: string;
}

export interface RoomShowcaseCMSItem {
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

export interface ShopByRoomCMS {
  eyebrow: string;
  titlePart1: string;
  titlePart2: string;
  rooms: RoomShowcaseCMSItem[];
}

export interface CatalogueHeaderCMS {
  eyebrow: string;
  title: string;
}

export interface QuizBannerBedCMS {
  id: string;
  image: string;
  label: string;
}

export interface QuizBannerCMS {
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  subtitle: string;
  ctaText: string;
  beds: QuizBannerBedCMS[];
}

export interface ReviewsSummaryCMS {
  averageRating: string;
  baseReviewCount: number;
}

export interface HomePageCMSData {
  heroSlides: HeroSlideData[];
  heroFeatures: HeroFeatureStripItem[];
  shopByRoom: ShopByRoomCMS;
  catalogueHeader: CatalogueHeaderCMS;
  quizBanner: QuizBannerCMS;
  reviewsSummary: ReviewsSummaryCMS;
}

// ============================================================================
// MATTRESSES & MEGA-MENU DROPDOWN COMPLETE CMS DATA TYPES
// ============================================================================
export interface MegaMenuCampaignCMS {
  eyebrow: string;
  headlineLine1: string;
  headlineLine2: string;
  headlineHighlight: string;
  description: string;
  ctaText: string;
  image: string;
}

export interface MegaMenuLifestyleCMS {
  image: string;
  altText: string;
}

export interface MattressesMegaMenuCMS {
  campaign: MegaMenuCampaignCMS;
  shopByTypeHeading: string;
  shopByTypeItems: MattressCategory[];
  coreMaterialsHeading: string;
  coreMaterialsItems: CoreMaterial[];
  topDesignsHeading: string;
  topDesignsItems: TopDesign[];
  lifestyleBanner: MegaMenuLifestyleCMS;
}

export interface CatalogueCategoryTabCMS {
  id: CatalogueCategoryId | 'all';
  label: string;
  shortLabel: string;
  description: string;
}

export interface MattressesCMSData {
  megaMenu: MattressesMegaMenuCMS;
  catalogueCategories: CatalogueCategoryTabCMS[];
  mattressModels: CatalogueMattressProduct[];
}

// ============================================================================
// PILLOWS & DROPDOWN COMPLETE CMS DATA TYPES
// ============================================================================
export interface PillowDropdownLinkCMS {
  label: string;
  href: string;
}

export interface PillowsHeroBannerCMS {
  badge: string;
  headlineMain: string;
  headlineHighlight: string;
  description: string;
  promiseTitle: string;
  promiseText: string;
  promiseLinkText: string;
}

export interface PillowPostureCardCMS {
  number: string;
  title: string;
  description: string;
  bestMatch: string;
}

export interface PillowsPostureGuideCMS {
  eyebrow: string;
  title: string;
  cards: PillowPostureCardCMS[];
  ctaText: string;
}

export interface PillowsCMSData {
  dropdownLinks: PillowDropdownLinkCMS[];
  heroBanner: PillowsHeroBannerCMS;
  reassuranceItems: string[];
  catalogueHeader: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  pillowModels: AccessoryItem[];
  postureGuide: PillowsPostureGuideCMS;
}

// ============================================================================
// COMPLETE FOOTER CMS DATA TYPES
// ============================================================================
export interface FooterPromiseBadgeCMS {
  title: string;
  sub: string;
}

export interface FooterLinkItemCMS {
  name: string;
  action: string;
  badge?: string;
}

export interface FooterNavGroupCMS {
  id: string;
  title: string;
  links: FooterLinkItemCMS[];
}

export interface FooterSocialItemCMS {
  label: string;
  href: string;
}

export interface FooterCMSData {
  promiseBadges: FooterPromiseBadgeCMS[];
  newsletter: {
    heading: string;
    subtext: string;
    placeholder: string;
    buttonText: string;
    successMessage: string;
  };
  brand: {
    logoUrl: string;
    description: string;
    certifications: string[];
    socialHeading: string;
    socials: FooterSocialItemCMS[];
  };
  navGroups: FooterNavGroupCMS[];
  concierge: {
    heading: string;
    phoneDisplay: string;
    phoneHref: string;
    phoneHours: string;
    emailDisplay: string;
    emailSubtext: string;
    showroomsTitle: string;
    showroomsLocations: string;
  };
  bottomBar: {
    copyrightBrand: string;
    copyrightSuffix: string;
    paymentLabel: string;
    paymentMethods: string[];
    legalLinks: Array<{ label: string; action: string }>;
  };
}

export interface ContactPageCMSData {
  hero: {
    badge: string;
    headlineMain: string;
    headlineHighlight: string;
    description: string;
  };
  reassuranceItems: string[];
  channelsHeader: {
    eyebrow: string;
    title: string;
    subtitle: string;
  };
  phoneCard: {
    title: string;
    phoneDisplay: string;
    phoneHref: string;
    hoursText: string;
  };
  whatsappCard: {
    title: string;
    numberDisplay: string;
    whatsappUrl: string;
    subtitle: string;
  };
  emailCard: {
    title: string;
    emailDisplay: string;
    subtitle: string;
  };
  headquartersCard: {
    title: string;
    address: string;
  };
  orderTrackingCard: {
    title: string;
    description: string;
    buttonText: string;
  };
  formConfig: {
    eyebrow: string;
    title: string;
    subtitle: string;
    subjectOptions: string[];
    submitButtonText: string;
    privacyNote: string;
    confirmationTitle: string;
  };
}

export interface WhyMindfreePillarCMS {
  num: string;
  title: string;
  desc: string;
}

export interface WhyMindfreeProvenanceCMS {
  title: string;
  desc: string;
}

export interface WhyMindfreeCMSData {
  dropdownLinks: Array<{ label: string; href: string }>;
  hero: {
    badge: string;
    headlineMain: string;
    headlineHighlight: string;
    description: string;
  };
  manifesto: {
    eyebrow: string;
    title: string;
    paragraphs: string[];
    image: string;
    imageQuote: string;
  };
  pillarsSection: {
    eyebrow: string;
    title: string;
    pillars: WhyMindfreePillarCMS[];
  };
  provenanceSection: {
    eyebrow: string;
    title: string;
    items: WhyMindfreeProvenanceCMS[];
  };
  ctaBanner: {
    title: string;
    subtitle: string;
    primaryButtonText: string;
    secondaryButtonText: string;
  };
}

export const DEFAULT_HOMEPAGE_CMS_DATA: HomePageCMSData = {
  heroSlides: HERO_SLIDES,
  heroFeatures: [
    {
      id: 'feat-1',
      titleAccent: 'Orthopedic',
      titleMain: 'Spine Support',
      subtitle: 'of multi-layer mattress structure',
    },
    {
      id: 'feat-2',
      titleAccent: 'FREE',
      titleMain: 'Delivery & Installation',
      subtitle: 'across all major cities',
    },
    {
      id: 'feat-3',
      titleAccent: 'High Quality',
      titleMain: '& Warranty',
      subtitle: 'on all handcrafted mattresses',
    },
  ],
  shopByRoom: {
    eyebrow: 'FIND THE PERFECT MATTRESS',
    titlePart1: 'SHOP BY ',
    titlePart2: 'ROOM',
    rooms: [
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
    ],
  },
  catalogueHeader: {
    eyebrow: 'MINDFREE MATTRESS COLLECTION',
    title: 'Explore Mattresses by Category',
  },
  quizBanner: {
    eyebrow: 'Mind Free Mattress',
    headlineLine1: 'Get Personalized Mattress',
    headlineLine2: 'Recommendations, Instantly',
    subtitle: 'Find your perfect comfort level in just a few steps.',
    ctaText: 'Take Mattress Finder Quiz',
    beds: [
      {
        id: 'bed-1',
        image: '/images/quiz-bed-1.png',
        label: 'Euro-Top Orthopedic',
      },
      {
        id: 'bed-2',
        image: '/images/quiz-bed-2.png',
        label: 'Royal Navy Box-Top',
      },
      {
        id: 'bed-3',
        image: '/images/quiz-bed-3.png',
        label: 'Aero-Cool Gel Pillow-Top',
      },
      {
        id: 'bed-4',
        image: '/images/quiz-bed-4.png',
        label: 'Organic Latex Euro-Top',
      },
    ],
  },
  reviewsSummary: {
    averageRating: '4.8',
    baseReviewCount: 946,
  },
};

export const DEFAULT_MATTRESSES_CMS_DATA: MattressesCMSData = {
  megaMenu: {
    campaign: {
      eyebrow: 'PREMIUM MATTRESSES',
      headlineLine1: 'Designed',
      headlineLine2: 'for a Healthier',
      headlineHighlight: 'Tomorrow',
      description: 'Advanced comfort. Natural materials. Better sleep for a brighter you.',
      ctaText: 'Explore All Mattresses',
      image: '/images/campaign_mattress_exact.png',
    },
    shopByTypeHeading: 'Shop by Type',
    shopByTypeItems: MATTRESS_CATEGORIES,
    coreMaterialsHeading: 'By Core Material',
    coreMaterialsItems: CORE_MATERIALS,
    topDesignsHeading: 'By Top Design',
    topDesignsItems: TOP_DESIGNS,
    lifestyleBanner: {
      image: '/images/bedroom_reference.png',
      altText: 'MINDFREE Luxury Bedroom Sanctuary',
    },
  },
  catalogueCategories: CATALOGUE_CATEGORIES,
  mattressModels: BED_PRICE_CATALOGUE_PRODUCTS,
};

export const DEFAULT_PILLOWS_CMS_DATA: PillowsCMSData = {
  dropdownLinks: [
    { label: 'Ergonomic Memory Foam Pillow', href: '/pillows/memory' },
    { label: 'Natural Latex Pillow', href: '/pillows/latex' },
    { label: 'Cooling Gel Pillow', href: '/pillows/cooling' },
    { label: 'Microfiber Plush Pillow', href: '/pillows/microfiber' },
  ],
  heroBanner: {
    badge: 'Cervical Ergonomics Collection',
    headlineMain: 'Anatomical Head & Neck Rest,',
    headlineHighlight: 'Engineered for Deep REM.',
    description:
      'Up to 30% of spinal misalignments originate in the cervical vertebrae. Mindfree pillows are handcrafted from pure organic latex, open-cell memory foam, and cooling matrices to maintain neutral cranial posture throughout the night.',
    promiseTitle: 'Posture Alignment Promise',
    promiseText:
      'Pairs seamlessly with our orthopedic and latex mattresses to ensure a 180° uninterrupted spine line from head to sacrum.',
    promiseLinkText: 'Read Cervical Science Guide',
  },
  reassuranceItems: [
    '30-Night Comfort Trial',
    '3-Year Sag-Proof Warranty',
    'Free Direct Shipping',
    'OEKO-TEX Certified',
  ],
  catalogueHeader: {
    eyebrow: 'Precision Formulations',
    title: 'The Mindfree Ergonomic Pillow Range',
    subtitle: 'Select your loft, density, and preferred thermal balance.',
  },
  pillowModels: PILLOWS_CATALOGUE,
  postureGuide: {
    eyebrow: 'Sleep Posture Matching',
    title: 'Which Pillow Matches Your Sleeping Posture?',
    cards: [
      {
        number: '01',
        title: 'Side Sleepers',
        description:
          'Need a higher loft (5.5" to 6") to bridge the gap between outer shoulder and ear.',
        bestMatch: 'Best Match: 100% Organic Latex Pillow',
      },
      {
        number: '02',
        title: 'Back Sleepers',
        description:
          'Require a medium contoured cradle (4" to 5") that supports the cervical lordosis curve without tilting the chin forward.',
        bestMatch: 'Best Match: Ergonomic Cervical Memory Foam',
      },
      {
        number: '03',
        title: 'Hot & Restless Sleepers',
        description:
          'Need continuous thermal dissipation away from the carotid arteries in the neck to prevent heat-induced micro-awakenings.',
        bestMatch: 'Best Match: Dual-Zone Cooling Gel Pillow',
      },
    ],
    ctaText: 'Read Clinical Pillow Height Guide',
  },
};

export const DEFAULT_FOOTER_CMS_DATA: FooterCMSData = {
  promiseBadges: [
    { title: '100 Nights Trial', sub: 'Risk-free home sleep test' },
    { title: '10 Years Warranty', sub: 'Direct factory protection' },
    { title: 'Free Pan-India Ship', sub: 'Safe doorstep delivery' },
    { title: '100% Certified Safe', sub: 'Zero toxic chemicals' },
  ],
  newsletter: {
    heading: 'Join the Mindfree Sleep Club',
    subtext: 'Get sleep posture guides & exclusive member privileges.',
    placeholder: 'Enter your email address...',
    buttonText: 'Subscribe',
    successMessage: 'Thank you for subscribing to Mindfree privileges!',
  },
  brand: {
    logoUrl: '/images/mindfree_logo_transparent.png?v=2',
    description:
      'Engineered for a healthier tomorrow. Mindfree handcrafts orthopedic, natural latex, pocket spring, and active cooling mattresses tailored to Indian body contours and climate.',
    certifications: ['ISO 9001:2015', 'OEKO-TEX® Fabrics', '100% Pure Latex'],
    socialHeading: 'Connect With Us',
    socials: [
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'Facebook', href: 'https://facebook.com' },
      { label: 'Pinterest', href: 'https://pinterest.com' },
      { label: 'YouTube', href: 'https://youtube.com' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
    ],
  },
  navGroups: [
    {
      id: 'shop',
      title: 'MATTRESSES & SLEEP',
      links: [
        { name: 'All 14 Mattresses', action: 'mattresses:all' },
        { name: 'Orthopedic & Back Support', action: 'mattresses:orthopedic', badge: 'Popular' },
        { name: 'Foam Mattresses', action: 'mattresses:foam' },
        { name: 'Spring Mattresses', action: 'mattresses:spring' },
        { name: 'Latex & Hybrid Mattresses', action: 'mattresses:latex' },
        { name: 'Cooling Technology', action: 'mattresses:cooling', badge: 'New' },
        { name: 'Ergonomic Pillows', action: 'pillows' },
      ],
    },
    {
      id: 'discover',
      title: 'EXPLORE MINDFREE',
      links: [
        { name: 'Home Sanctuary', action: 'home' },
        { name: 'Why Mindfree (Our Story)', action: 'our-story' },
        { name: 'Shop By Room', action: 'scroll:shop-by-room' },
        { name: 'Mattress Finder Quiz', action: 'mattress-finder' },
        { name: 'Customer Reviews (4.9★)', action: 'scroll:why-choose-mindfree' },
        { name: 'Store Locator', action: 'store-locator' },
      ],
    },
    {
      id: 'customer-care',
      title: 'CUSTOMER CARE',
      links: [
        { name: 'My Account & Orders', action: 'account:orders' },
        { name: 'Track Order Status', action: 'account:tracking' },
        { name: 'My Wishlist', action: 'wishlist' },
        { name: '100-Night Risk-Free Trial', action: 'contact' },
        { name: '10-Year Warranty Claim', action: 'contact' },
        { name: 'Contact Sleep Concierge', action: 'contact' },
        { name: 'Atelier Dispatch Center', action: 'admin' },
      ],
    },
  ],
  concierge: {
    heading: 'CONCIERGE & SHOWROOMS',
    phoneDisplay: '+91 (0) 800 555 7533',
    phoneHref: '+918005557533',
    phoneHours: 'Mon – Sun, 9:00 AM – 9:00 PM IST',
    emailDisplay: 'concierge@mindfree.com',
    emailSubtext: 'Custom Sizing & Sleep Advice',
    showroomsTitle: 'Experience Centers',
    showroomsLocations: 'Bengaluru • Mumbai • New Delhi • Hyderabad',
  },
  bottomBar: {
    copyrightBrand: 'MINDFREE',
    copyrightSuffix: 'Sleep Systems Pvt. Ltd. All rights reserved.',
    paymentLabel: '100% Secure Payments:',
    paymentMethods: ['UPI', 'VISA', 'Mastercard', 'RuPay', '0% EMI', 'NetBanking'],
    legalLinks: [
      { label: 'Privacy Policy', action: 'contact' },
      { label: 'Terms & Conditions', action: 'contact' },
      { label: 'Shipping & Returns', action: 'contact' },
    ],
  },
};

export const DEFAULT_CONTACT_CMS_DATA: ContactPageCMSData = {
  hero: {
    badge: 'Dedicated Client Concierge',
    headlineMain: 'How May Our Sleep Concierge',
    headlineHighlight: 'Assist You Today?',
    description:
      'Whether you seek guidance on lumbar firmness calibration, want to track an active atelier commission, or wish to schedule a white-glove bedroom setup, our concierge team is at your service.',
  },
  reassuranceItems: [
    'Average Concierge Response: < 15 Mins',
    '10-Year Direct Atelier Warranty',
    'Zero-Friction Return Coordination',
    'Real-Time Order Logistics',
  ],
  channelsHeader: {
    eyebrow: 'Direct Channels',
    title: 'Reach Our Atelier Directly',
    subtitle: 'Connect with our certified sleep advisors across phone, WhatsApp, or email.',
  },
  phoneCard: {
    title: 'Direct Telephone Helpline',
    phoneDisplay: '+91 80 4719 3200',
    phoneHref: '+918047193200',
    hoursText: 'Monday to Saturday, 9:00 AM – 8:00 PM IST',
  },
  whatsappCard: {
    title: 'WhatsApp Live Chat',
    numberDisplay: '+91 98860 12345',
    whatsappUrl: 'https://wa.me/919886012345',
    subtitle: 'Instant advice & photo consultations with bedmakers',
  },
  emailCard: {
    title: 'Atelier Electronic Mail',
    emailDisplay: 'concierge@mindfree.in',
    subtitle: 'Written replies guaranteed within 4 business hours',
  },
  headquartersCard: {
    title: 'Corporate Headquarters',
    address:
      'Mindfree Sleep Systems Pvt Ltd, Block 4B, Embassy TechVillage, Outer Ring Road, Bengaluru, Karnataka 560103',
  },
  orderTrackingCard: {
    title: 'Have an Existing Order?',
    description:
      'Track your manufacturing, dispatch, and delivery stages in real-time on our customer portal.',
    buttonText: 'Track Live Order Status',
  },
  formConfig: {
    eyebrow: 'Direct Inquiry',
    title: 'Send a Message to the Concierge Desk',
    subtitle: 'We typically respond in less than 4 business hours.',
    subjectOptions: [
      'Product Consultation & Sizing',
      'Order Tracking & Logistics',
      '100-Night Trial / Exchange Inquiry',
      'Warranty Claim & Technical Service',
      'Bespoke Custom Dimensions or Hospitality',
    ],
    submitButtonText: 'Transmit Enquiry to Concierge',
    privacyNote: 'Your personal information is confidential and never shared with third parties.',
    confirmationTitle: 'Enquiry Dispatched to Concierge',
  },
};

export const DEFAULT_WHY_MINDFREE_CMS_DATA: WhyMindfreeCMSData = {
  dropdownLinks: [
    { label: 'Our Sleep Philosophy', href: '/about' },
    { label: 'Zero-Toxic Certifications', href: '/certifications' },
    { label: 'Customer Reviews (4.9/5)', href: '/reviews' },
    { label: 'Sustainability & ESG', href: '/sustainability' },
  ],
  hero: {
    badge: 'The Mindfree Heritage & Philosophy',
    headlineMain: 'We Founded Mindfree to Restore',
    headlineHighlight: 'Pure Human Rest.',
    description:
      'In an industry dominated by polyurethane shortcuts, false synthetic marketing, and hidden markups, we returned to first principles: honest botanical materials, clinical biomechanics, and genuine master bedmaking.',
  },
  manifesto: {
    eyebrow: 'The Mindfree Manifesto',
    title: 'A Third of Your Life Deserves Zero Compromise.',
    paragraphs: [
      'Sleep is not a commodity to be vacuum-rolled in a synthetic sack and forgotten. It is the singular biological window where human cellular repair, spinal disc rehydration, and neurological consolidation take place.',
      'When you sleep on off-gassing petroleum foams that trap body heat and sag after two years, your body spends the night fighting inflammation rather than restoring vitality.',
      'At Mindfree, we handcraft sleep systems that adapt to you—delivering zero partner motion disturbance, breathable temperature regulation, and verifiable 10-year durability.',
    ],
    image: '/images/mindfree/craftsmanship-bedroom.webp',
    imageQuote:
      '"We don\'t manufacture beds on high-speed robotic conveyors. We commission them one by one."',
  },
  pillarsSection: {
    eyebrow: 'Guiding Standards',
    title: 'The Four Pillars of Mindfree Architecture',
    pillars: [
      {
        num: '01',
        title: 'Botanical Purity',
        desc: 'Tapped from certified organic Hevea rubber trees in Kerala and woven from organic cotton fibers, free of harmful formaldehyde.',
      },
      {
        num: '02',
        title: '7-Zone Clinical Posture',
        desc: 'Collaboratively designed with orthopedic surgeons to decompress the lumbar lordosis while gently cradling deltoids and pelvis.',
      },
      {
        num: '03',
        title: 'Individual Hand-Tufting',
        desc: 'Hand-sewn inner tape edging and perimeter border quilting ensure the mattress never mushrooms or develops edge sag.',
      },
      {
        num: '04',
        title: 'Direct-to-Sanctuary',
        desc: 'Direct atelier commissioning without intermediary showrooms or inflated distributors, backed by our 100-night trial.',
      },
    ],
  },
  provenanceSection: {
    eyebrow: 'Ethical Sourcing',
    title: 'The Provenance of Every Raw Fiber',
    items: [
      {
        title: 'Natural Hevea Latex — Kerala, India',
        desc: 'Harvested sustainably without felling trees. Each mature tree yields rubber milk for over 25 years, creating breathable pin-core aerated foam with natural antimicrobial properties.',
      },
      {
        title: 'Belgian Damask Weaving — Flanders, Belgium',
        desc: 'Woven on traditional jacquard looms by fourth-generation textile masters. Provides unmatched tactile silkiness while resisting pill formation and surface abrasion.',
      },
      {
        title: 'High-Tensile Barrel Coils — Coimbatore, India',
        desc: 'Individually heat-tempered carbon steel springs encased in sonic-sealed acoustic spunbond fabric. Tested to endure 100,000 continuous compression cycles.',
      },
    ],
  },
  ctaBanner: {
    title: 'Experience the Mindfree Difference',
    subtitle: 'Discover our signature orthopedic and botanical latex collections today.',
    primaryButtonText: 'Explore Mattresses',
    secondaryButtonText: 'Visit an Atelier',
  },
};

const STORAGE_CACHE_KEY = 'mindfree_home_page_cms_v2';
const LEGACY_HOME_CACHE_KEY = 'mindfree_home_page_cms_v1';
const MATTRESSES_CACHE_KEY = 'mindfree_mattresses_cms_v5';
const LEGACY_MATTRESSES_V4_KEY = 'mindfree_mattresses_cms_v4';
const LEGACY_MATTRESSES_CACHE_KEY = 'mindfree_mattresses_cms_v3';
const PILLOWS_CACHE_KEY = 'mindfree_pillows_cms_v2';
const LEGACY_PILLOWS_CACHE_KEY = 'mindfree_pillows_cms_v1';
const FOOTER_CACHE_KEY = 'mindfree_footer_cms_v1';
const CONTACT_CACHE_KEY = 'mindfree_contact_cms_v1';
const WHY_MINDFREE_CACHE_KEY = 'mindfree_why_cms_v1';

const IDB_NAME = 'mindfree_hd_cms_db';
const IDB_STORE = 'cms_store';

function openCmsIdb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      if (typeof window === 'undefined' || !window.indexedDB) {
        resolve(null);
        return;
      }
      const req = window.indexedDB.open(IDB_NAME, 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE)) {
          db.createObjectStore(IDB_STORE);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function saveToHdStorage(key: string, value: unknown): Promise<void> {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // If Full-HD images exceed localStorage's 5MB limit, IndexedDB below persists up to 500MB+
  }
  try {
    const db = await openCmsIdb();
    if (!db) return;
    await new Promise<void>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readwrite');
      tx.objectStore(IDB_STORE).put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {
    // ignore
  }
}

async function loadFromHdStorage<T>(key: string): Promise<T | null> {
  try {
    const db = await openCmsIdb();
    if (!db) return null;
    return await new Promise<T | null>((resolve) => {
      const tx = db.transaction(IDB_STORE, 'readonly');
      const req = tx.objectStore(IDB_STORE).get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

interface HomePageContentContextType {
  homePageData: HomePageCMSData;
  isSavingHomePage: boolean;
  saveHomePageData: (nextData: HomePageCMSData) => Promise<boolean>;
  resetHomePageData: () => Promise<boolean>;
  refreshHomePageData: () => Promise<void>;
  mattressesData: MattressesCMSData;
  isSavingMattresses: boolean;
  saveMattressesData: (nextData: MattressesCMSData) => Promise<boolean>;
  resetMattressesData: () => Promise<boolean>;
  pillowsData: PillowsCMSData;
  isSavingPillows: boolean;
  savePillowsData: (nextData: PillowsCMSData) => Promise<boolean>;
  resetPillowsData: () => Promise<boolean>;
  footerData: FooterCMSData;
  isSavingFooter: boolean;
  saveFooterData: (nextData: FooterCMSData) => Promise<boolean>;
  resetFooterData: () => Promise<boolean>;
  contactData: ContactPageCMSData;
  isSavingContact: boolean;
  saveContactData: (nextData: ContactPageCMSData) => Promise<boolean>;
  resetContactData: () => Promise<boolean>;
  whyMindfreeData: WhyMindfreeCMSData;
  isSavingWhyMindfree: boolean;
  saveWhyMindfreeData: (nextData: WhyMindfreeCMSData) => Promise<boolean>;
  resetWhyMindfreeData: () => Promise<boolean>;
}

const HomePageContentContext = createContext<HomePageContentContextType | undefined>(undefined);

function mergeHomePageData(raw: Partial<HomePageCMSData> | null | undefined): HomePageCMSData {
  if (!raw || typeof raw !== 'object') return DEFAULT_HOMEPAGE_CMS_DATA;
  return {
    heroSlides:
      Array.isArray(raw.heroSlides) && raw.heroSlides.length > 0
        ? raw.heroSlides
        : DEFAULT_HOMEPAGE_CMS_DATA.heroSlides,
    heroFeatures:
      Array.isArray(raw.heroFeatures) && raw.heroFeatures.length === 3
        ? raw.heroFeatures
        : DEFAULT_HOMEPAGE_CMS_DATA.heroFeatures,
    shopByRoom: {
      eyebrow: raw.shopByRoom?.eyebrow ?? DEFAULT_HOMEPAGE_CMS_DATA.shopByRoom.eyebrow,
      titlePart1: raw.shopByRoom?.titlePart1 ?? DEFAULT_HOMEPAGE_CMS_DATA.shopByRoom.titlePart1,
      titlePart2: raw.shopByRoom?.titlePart2 ?? DEFAULT_HOMEPAGE_CMS_DATA.shopByRoom.titlePart2,
      rooms:
        Array.isArray(raw.shopByRoom?.rooms) && raw.shopByRoom.rooms.length > 0
          ? raw.shopByRoom.rooms
          : DEFAULT_HOMEPAGE_CMS_DATA.shopByRoom.rooms,
    },
    catalogueHeader: {
      eyebrow: raw.catalogueHeader?.eyebrow ?? DEFAULT_HOMEPAGE_CMS_DATA.catalogueHeader.eyebrow,
      title: raw.catalogueHeader?.title ?? DEFAULT_HOMEPAGE_CMS_DATA.catalogueHeader.title,
    },
    quizBanner: {
      eyebrow: raw.quizBanner?.eyebrow ?? DEFAULT_HOMEPAGE_CMS_DATA.quizBanner.eyebrow,
      headlineLine1:
        raw.quizBanner?.headlineLine1 ?? DEFAULT_HOMEPAGE_CMS_DATA.quizBanner.headlineLine1,
      headlineLine2:
        raw.quizBanner?.headlineLine2 ?? DEFAULT_HOMEPAGE_CMS_DATA.quizBanner.headlineLine2,
      subtitle: raw.quizBanner?.subtitle ?? DEFAULT_HOMEPAGE_CMS_DATA.quizBanner.subtitle,
      ctaText: raw.quizBanner?.ctaText ?? DEFAULT_HOMEPAGE_CMS_DATA.quizBanner.ctaText,
      beds:
        Array.isArray(raw.quizBanner?.beds) && raw.quizBanner.beds.length > 0
          ? raw.quizBanner.beds
          : DEFAULT_HOMEPAGE_CMS_DATA.quizBanner.beds,
    },
    reviewsSummary: {
      averageRating:
        raw.reviewsSummary?.averageRating ?? DEFAULT_HOMEPAGE_CMS_DATA.reviewsSummary.averageRating,
      baseReviewCount:
        typeof raw.reviewsSummary?.baseReviewCount === 'number'
          ? raw.reviewsSummary.baseReviewCount
          : DEFAULT_HOMEPAGE_CMS_DATA.reviewsSummary.baseReviewCount,
    },
  };
}

function isLowResIconUrl(url?: string | null): boolean {
  if (!url) return true;
  return (
    url.startsWith('/images/type_') ||
    url.startsWith('/images/mat_') ||
    url.startsWith('/images/design_') ||
    url.startsWith('/images/thumb-') ||
    url.includes('royal-navy-box-top.png')
  );
}

function sanitizeMattressModelImages(model: CatalogueMattressProduct): CatalogueMattressProduct {
  const defaultMatch = DEFAULT_MATTRESSES_CMS_DATA.mattressModels.find((d) => d.id === model.id);
  const fallbackHero = defaultMatch?.images.hero || '/images/products/product-deluxe.jpg';
  const hero = isLowResIconUrl(model.images?.hero) ? fallbackHero : model.images.hero;
  const isHeroCustomized = hero.startsWith('data:image/') || hero !== fallbackHero;
  const rawCooling = model.images?.coolingHero;
  const isCoolingStillDefault = !rawCooling || rawCooling === defaultMatch?.images.coolingHero;

  const coolingHero =
    isHeroCustomized && isCoolingStillDefault
      ? hero
      : rawCooling && !isLowResIconUrl(rawCooling)
      ? rawCooling
      : defaultMatch?.images.coolingHero;

  return {
    ...model,
    images: {
      ...(defaultMatch?.images || model.images),
      ...model.images,
      hero,
      ...(coolingHero ? { coolingHero } : {}),
    },
  };
}

function mergeMattressesData(
  raw: Partial<MattressesCMSData> | null | undefined,
  pgProducts: PgProductRecord[] = [],
  restoreMissingOrthoPlus = false
): MattressesCMSData {
  const defMenu = DEFAULT_MATTRESSES_CMS_DATA.megaMenu;
  const baseModels =
    raw && Array.isArray(raw.mattressModels) && raw.mattressModels.length > 0
      ? raw.mattressModels.map(sanitizeMattressModelImages)
      : DEFAULT_MATTRESSES_CMS_DATA.mattressModels;

  // Ensure #11 ortho-plus is restored on legacy v3 migration
  const existingIds = new Set(baseModels.map((m) => m.id));
  const restoredBaseModels = [...baseModels];
  if (restoreMissingOrthoPlus && !existingIds.has('ortho-plus')) {
    const orthoPlusDefault = DEFAULT_MATTRESSES_CMS_DATA.mattressModels.find(
      (m) => m.id === 'ortho-plus'
    );
    if (orthoPlusDefault) {
      const insertAfterIdx = restoredBaseModels.findIndex((m) => m.id === 'ultra-latex-plus');
      if (insertAfterIdx !== -1) {
        restoredBaseModels.splice(insertAfterIdx + 1, 0, orthoPlusDefault);
      } else {
        restoredBaseModels.splice(Math.min(10, restoredBaseModels.length), 0, orthoPlusDefault);
      }
      existingIds.add('ortho-plus');
    }
  }

  const template = restoredBaseModels[0] || DEFAULT_MATTRESSES_CMS_DATA.mattressModels[0];
  const pgExtras: CatalogueMattressProduct[] = pgProducts
    .filter((r) => !existingIds.has(r.id))
    .map((r) =>
      sanitizeMattressModelImages({
        ...template,
        id: r.id,
        slug: r.slug,
        name: r.name,
        tagline: r.tagline || 'Handcrafted Mindfree Sleep System',
        categories: (r.categories?.length ? r.categories : ['orthopedic']) as CatalogueCategoryId[],
        topFinishStyle: (r.top_finish_style ||
          'Euro / Box Top') as CatalogueMattressProduct['topFinishStyle'],
        warrantyMonths: Number(r.warranty_months) || 60,
        warrantyYears: Math.round((Number(r.warranty_months) || 60) / 12),
        startingPrice: Number(r.starting_price) || 13499,
        thicknessOptions: r.thickness_options?.length ? r.thickness_options : [6, 8, 10],
        images: {
          ...template.images,
          hero: r.hero_image || '/images/products/product-deluxe.jpg',
          coolingHero: r.cooling_image || undefined,
        },
        priceMatrix: [],
      })
    );

  const mergedModels = [...restoredBaseModels, ...pgExtras].map(sanitizeMattressModelImages);

  if (!raw || typeof raw !== 'object') {
    return {
      ...DEFAULT_MATTRESSES_CMS_DATA,
      mattressModels: mergedModels,
    };
  }

  return {
    megaMenu: {
      campaign: {
        eyebrow: raw.megaMenu?.campaign?.eyebrow ?? defMenu.campaign.eyebrow,
        headlineLine1: raw.megaMenu?.campaign?.headlineLine1 ?? defMenu.campaign.headlineLine1,
        headlineLine2: raw.megaMenu?.campaign?.headlineLine2 ?? defMenu.campaign.headlineLine2,
        headlineHighlight:
          raw.megaMenu?.campaign?.headlineHighlight ?? defMenu.campaign.headlineHighlight,
        description: raw.megaMenu?.campaign?.description ?? defMenu.campaign.description,
        ctaText: raw.megaMenu?.campaign?.ctaText ?? defMenu.campaign.ctaText,
        image: raw.megaMenu?.campaign?.image ?? defMenu.campaign.image,
      },
      shopByTypeHeading: raw.megaMenu?.shopByTypeHeading ?? defMenu.shopByTypeHeading,
      shopByTypeItems:
        Array.isArray(raw.megaMenu?.shopByTypeItems) && raw.megaMenu.shopByTypeItems.length > 0
          ? raw.megaMenu.shopByTypeItems
          : defMenu.shopByTypeItems,
      coreMaterialsHeading: raw.megaMenu?.coreMaterialsHeading ?? defMenu.coreMaterialsHeading,
      coreMaterialsItems:
        Array.isArray(raw.megaMenu?.coreMaterialsItems) &&
        raw.megaMenu.coreMaterialsItems.length > 0
          ? raw.megaMenu.coreMaterialsItems
          : defMenu.coreMaterialsItems,
      topDesignsHeading: raw.megaMenu?.topDesignsHeading ?? defMenu.topDesignsHeading,
      topDesignsItems:
        Array.isArray(raw.megaMenu?.topDesignsItems) && raw.megaMenu.topDesignsItems.length > 0
          ? raw.megaMenu.topDesignsItems
          : defMenu.topDesignsItems,
      lifestyleBanner: {
        image: raw.megaMenu?.lifestyleBanner?.image ?? defMenu.lifestyleBanner.image,
        altText: raw.megaMenu?.lifestyleBanner?.altText ?? defMenu.lifestyleBanner.altText,
      },
    },
    catalogueCategories:
      Array.isArray(raw.catalogueCategories) && raw.catalogueCategories.length > 0
        ? raw.catalogueCategories
        : DEFAULT_MATTRESSES_CMS_DATA.catalogueCategories,
    mattressModels: mergedModels,
  };
}

function mergePillowsData(raw: Partial<PillowsCMSData> | null | undefined): PillowsCMSData {
  if (!raw || typeof raw !== 'object') return DEFAULT_PILLOWS_CMS_DATA;
  return {
    dropdownLinks:
      Array.isArray(raw.dropdownLinks) && raw.dropdownLinks.length > 0
        ? raw.dropdownLinks
        : DEFAULT_PILLOWS_CMS_DATA.dropdownLinks,
    heroBanner: {
      badge: raw.heroBanner?.badge ?? DEFAULT_PILLOWS_CMS_DATA.heroBanner.badge,
      headlineMain:
        raw.heroBanner?.headlineMain ?? DEFAULT_PILLOWS_CMS_DATA.heroBanner.headlineMain,
      headlineHighlight:
        raw.heroBanner?.headlineHighlight ?? DEFAULT_PILLOWS_CMS_DATA.heroBanner.headlineHighlight,
      description: raw.heroBanner?.description ?? DEFAULT_PILLOWS_CMS_DATA.heroBanner.description,
      promiseTitle:
        raw.heroBanner?.promiseTitle ?? DEFAULT_PILLOWS_CMS_DATA.heroBanner.promiseTitle,
      promiseText: raw.heroBanner?.promiseText ?? DEFAULT_PILLOWS_CMS_DATA.heroBanner.promiseText,
      promiseLinkText:
        raw.heroBanner?.promiseLinkText ?? DEFAULT_PILLOWS_CMS_DATA.heroBanner.promiseLinkText,
    },
    reassuranceItems:
      Array.isArray(raw.reassuranceItems) && raw.reassuranceItems.length === 4
        ? raw.reassuranceItems
        : DEFAULT_PILLOWS_CMS_DATA.reassuranceItems,
    catalogueHeader: {
      eyebrow: raw.catalogueHeader?.eyebrow ?? DEFAULT_PILLOWS_CMS_DATA.catalogueHeader.eyebrow,
      title: raw.catalogueHeader?.title ?? DEFAULT_PILLOWS_CMS_DATA.catalogueHeader.title,
      subtitle: raw.catalogueHeader?.subtitle ?? DEFAULT_PILLOWS_CMS_DATA.catalogueHeader.subtitle,
    },
    pillowModels:
      Array.isArray(raw.pillowModels) && raw.pillowModels.length > 0
        ? raw.pillowModels
        : DEFAULT_PILLOWS_CMS_DATA.pillowModels,
    postureGuide: {
      eyebrow: raw.postureGuide?.eyebrow ?? DEFAULT_PILLOWS_CMS_DATA.postureGuide.eyebrow,
      title: raw.postureGuide?.title ?? DEFAULT_PILLOWS_CMS_DATA.postureGuide.title,
      cards:
        Array.isArray(raw.postureGuide?.cards) && raw.postureGuide.cards.length > 0
          ? raw.postureGuide.cards
          : DEFAULT_PILLOWS_CMS_DATA.postureGuide.cards,
      ctaText: raw.postureGuide?.ctaText ?? DEFAULT_PILLOWS_CMS_DATA.postureGuide.ctaText,
    },
  };
}

function mergeFooterData(raw: Partial<FooterCMSData> | null | undefined): FooterCMSData {
  if (!raw || typeof raw !== 'object') return DEFAULT_FOOTER_CMS_DATA;
  return {
    promiseBadges:
      Array.isArray(raw.promiseBadges) && raw.promiseBadges.length > 0
        ? raw.promiseBadges
        : DEFAULT_FOOTER_CMS_DATA.promiseBadges,
    newsletter: {
      heading: raw.newsletter?.heading ?? DEFAULT_FOOTER_CMS_DATA.newsletter.heading,
      subtext: raw.newsletter?.subtext ?? DEFAULT_FOOTER_CMS_DATA.newsletter.subtext,
      placeholder: raw.newsletter?.placeholder ?? DEFAULT_FOOTER_CMS_DATA.newsletter.placeholder,
      buttonText: raw.newsletter?.buttonText ?? DEFAULT_FOOTER_CMS_DATA.newsletter.buttonText,
      successMessage:
        raw.newsletter?.successMessage ?? DEFAULT_FOOTER_CMS_DATA.newsletter.successMessage,
    },
    brand: {
      logoUrl: raw.brand?.logoUrl ?? DEFAULT_FOOTER_CMS_DATA.brand.logoUrl,
      description: raw.brand?.description ?? DEFAULT_FOOTER_CMS_DATA.brand.description,
      certifications:
        Array.isArray(raw.brand?.certifications) && raw.brand.certifications.length > 0
          ? raw.brand.certifications
          : DEFAULT_FOOTER_CMS_DATA.brand.certifications,
      socialHeading: raw.brand?.socialHeading ?? DEFAULT_FOOTER_CMS_DATA.brand.socialHeading,
      socials:
        Array.isArray(raw.brand?.socials) && raw.brand.socials.length > 0
          ? raw.brand.socials
          : DEFAULT_FOOTER_CMS_DATA.brand.socials,
    },
    navGroups:
      Array.isArray(raw.navGroups) && raw.navGroups.length > 0
        ? raw.navGroups
        : DEFAULT_FOOTER_CMS_DATA.navGroups,
    concierge: {
      heading: raw.concierge?.heading ?? DEFAULT_FOOTER_CMS_DATA.concierge.heading,
      phoneDisplay: raw.concierge?.phoneDisplay ?? DEFAULT_FOOTER_CMS_DATA.concierge.phoneDisplay,
      phoneHref: raw.concierge?.phoneHref ?? DEFAULT_FOOTER_CMS_DATA.concierge.phoneHref,
      phoneHours: raw.concierge?.phoneHours ?? DEFAULT_FOOTER_CMS_DATA.concierge.phoneHours,
      emailDisplay: raw.concierge?.emailDisplay ?? DEFAULT_FOOTER_CMS_DATA.concierge.emailDisplay,
      emailSubtext: raw.concierge?.emailSubtext ?? DEFAULT_FOOTER_CMS_DATA.concierge.emailSubtext,
      showroomsTitle:
        raw.concierge?.showroomsTitle ?? DEFAULT_FOOTER_CMS_DATA.concierge.showroomsTitle,
      showroomsLocations:
        raw.concierge?.showroomsLocations ?? DEFAULT_FOOTER_CMS_DATA.concierge.showroomsLocations,
    },
    bottomBar: {
      copyrightBrand:
        raw.bottomBar?.copyrightBrand ?? DEFAULT_FOOTER_CMS_DATA.bottomBar.copyrightBrand,
      copyrightSuffix:
        raw.bottomBar?.copyrightSuffix ?? DEFAULT_FOOTER_CMS_DATA.bottomBar.copyrightSuffix,
      paymentLabel: raw.bottomBar?.paymentLabel ?? DEFAULT_FOOTER_CMS_DATA.bottomBar.paymentLabel,
      paymentMethods:
        Array.isArray(raw.bottomBar?.paymentMethods) && raw.bottomBar.paymentMethods.length > 0
          ? raw.bottomBar.paymentMethods
          : DEFAULT_FOOTER_CMS_DATA.bottomBar.paymentMethods,
      legalLinks:
        Array.isArray(raw.bottomBar?.legalLinks) && raw.bottomBar.legalLinks.length > 0
          ? raw.bottomBar.legalLinks
          : DEFAULT_FOOTER_CMS_DATA.bottomBar.legalLinks,
    },
  };
}

function mergeContactData(raw: Partial<ContactPageCMSData> | null | undefined): ContactPageCMSData {
  if (!raw || typeof raw !== 'object') return DEFAULT_CONTACT_CMS_DATA;
  return {
    hero: {
      badge: raw.hero?.badge ?? DEFAULT_CONTACT_CMS_DATA.hero.badge,
      headlineMain: raw.hero?.headlineMain ?? DEFAULT_CONTACT_CMS_DATA.hero.headlineMain,
      headlineHighlight:
        raw.hero?.headlineHighlight ?? DEFAULT_CONTACT_CMS_DATA.hero.headlineHighlight,
      description: raw.hero?.description ?? DEFAULT_CONTACT_CMS_DATA.hero.description,
    },
    reassuranceItems:
      Array.isArray(raw.reassuranceItems) && raw.reassuranceItems.length === 4
        ? raw.reassuranceItems
        : DEFAULT_CONTACT_CMS_DATA.reassuranceItems,
    channelsHeader: {
      eyebrow: raw.channelsHeader?.eyebrow ?? DEFAULT_CONTACT_CMS_DATA.channelsHeader.eyebrow,
      title: raw.channelsHeader?.title ?? DEFAULT_CONTACT_CMS_DATA.channelsHeader.title,
      subtitle: raw.channelsHeader?.subtitle ?? DEFAULT_CONTACT_CMS_DATA.channelsHeader.subtitle,
    },
    phoneCard: {
      title: raw.phoneCard?.title ?? DEFAULT_CONTACT_CMS_DATA.phoneCard.title,
      phoneDisplay: raw.phoneCard?.phoneDisplay ?? DEFAULT_CONTACT_CMS_DATA.phoneCard.phoneDisplay,
      phoneHref: raw.phoneCard?.phoneHref ?? DEFAULT_CONTACT_CMS_DATA.phoneCard.phoneHref,
      hoursText: raw.phoneCard?.hoursText ?? DEFAULT_CONTACT_CMS_DATA.phoneCard.hoursText,
    },
    whatsappCard: {
      title: raw.whatsappCard?.title ?? DEFAULT_CONTACT_CMS_DATA.whatsappCard.title,
      numberDisplay:
        raw.whatsappCard?.numberDisplay ?? DEFAULT_CONTACT_CMS_DATA.whatsappCard.numberDisplay,
      whatsappUrl: raw.whatsappCard?.whatsappUrl ?? DEFAULT_CONTACT_CMS_DATA.whatsappCard.whatsappUrl,
      subtitle: raw.whatsappCard?.subtitle ?? DEFAULT_CONTACT_CMS_DATA.whatsappCard.subtitle,
    },
    emailCard: {
      title: raw.emailCard?.title ?? DEFAULT_CONTACT_CMS_DATA.emailCard.title,
      emailDisplay: raw.emailCard?.emailDisplay ?? DEFAULT_CONTACT_CMS_DATA.emailCard.emailDisplay,
      subtitle: raw.emailCard?.subtitle ?? DEFAULT_CONTACT_CMS_DATA.emailCard.subtitle,
    },
    headquartersCard: {
      title: raw.headquartersCard?.title ?? DEFAULT_CONTACT_CMS_DATA.headquartersCard.title,
      address: raw.headquartersCard?.address ?? DEFAULT_CONTACT_CMS_DATA.headquartersCard.address,
    },
    orderTrackingCard: {
      title: raw.orderTrackingCard?.title ?? DEFAULT_CONTACT_CMS_DATA.orderTrackingCard.title,
      description:
        raw.orderTrackingCard?.description ?? DEFAULT_CONTACT_CMS_DATA.orderTrackingCard.description,
      buttonText:
        raw.orderTrackingCard?.buttonText ?? DEFAULT_CONTACT_CMS_DATA.orderTrackingCard.buttonText,
    },
    formConfig: {
      eyebrow: raw.formConfig?.eyebrow ?? DEFAULT_CONTACT_CMS_DATA.formConfig.eyebrow,
      title: raw.formConfig?.title ?? DEFAULT_CONTACT_CMS_DATA.formConfig.title,
      subtitle: raw.formConfig?.subtitle ?? DEFAULT_CONTACT_CMS_DATA.formConfig.subtitle,
      subjectOptions:
        Array.isArray(raw.formConfig?.subjectOptions) && raw.formConfig.subjectOptions.length > 0
          ? raw.formConfig.subjectOptions
          : DEFAULT_CONTACT_CMS_DATA.formConfig.subjectOptions,
      submitButtonText:
        raw.formConfig?.submitButtonText ?? DEFAULT_CONTACT_CMS_DATA.formConfig.submitButtonText,
      privacyNote: raw.formConfig?.privacyNote ?? DEFAULT_CONTACT_CMS_DATA.formConfig.privacyNote,
      confirmationTitle:
        raw.formConfig?.confirmationTitle ?? DEFAULT_CONTACT_CMS_DATA.formConfig.confirmationTitle,
    },
  };
}

function mergeWhyMindfreeData(
  raw: Partial<WhyMindfreeCMSData> | null | undefined
): WhyMindfreeCMSData {
  if (!raw || typeof raw !== 'object') return DEFAULT_WHY_MINDFREE_CMS_DATA;
  return {
    dropdownLinks:
      Array.isArray(raw.dropdownLinks) && raw.dropdownLinks.length > 0
        ? raw.dropdownLinks
        : DEFAULT_WHY_MINDFREE_CMS_DATA.dropdownLinks,
    hero: {
      badge: raw.hero?.badge ?? DEFAULT_WHY_MINDFREE_CMS_DATA.hero.badge,
      headlineMain: raw.hero?.headlineMain ?? DEFAULT_WHY_MINDFREE_CMS_DATA.hero.headlineMain,
      headlineHighlight:
        raw.hero?.headlineHighlight ?? DEFAULT_WHY_MINDFREE_CMS_DATA.hero.headlineHighlight,
      description: raw.hero?.description ?? DEFAULT_WHY_MINDFREE_CMS_DATA.hero.description,
    },
    manifesto: {
      eyebrow: raw.manifesto?.eyebrow ?? DEFAULT_WHY_MINDFREE_CMS_DATA.manifesto.eyebrow,
      title: raw.manifesto?.title ?? DEFAULT_WHY_MINDFREE_CMS_DATA.manifesto.title,
      paragraphs:
        Array.isArray(raw.manifesto?.paragraphs) && raw.manifesto.paragraphs.length > 0
          ? raw.manifesto.paragraphs
          : DEFAULT_WHY_MINDFREE_CMS_DATA.manifesto.paragraphs,
      image: raw.manifesto?.image ?? DEFAULT_WHY_MINDFREE_CMS_DATA.manifesto.image,
      imageQuote: raw.manifesto?.imageQuote ?? DEFAULT_WHY_MINDFREE_CMS_DATA.manifesto.imageQuote,
    },
    pillarsSection: {
      eyebrow:
        raw.pillarsSection?.eyebrow ?? DEFAULT_WHY_MINDFREE_CMS_DATA.pillarsSection.eyebrow,
      title: raw.pillarsSection?.title ?? DEFAULT_WHY_MINDFREE_CMS_DATA.pillarsSection.title,
      pillars:
        Array.isArray(raw.pillarsSection?.pillars) && raw.pillarsSection.pillars.length > 0
          ? raw.pillarsSection.pillars
          : DEFAULT_WHY_MINDFREE_CMS_DATA.pillarsSection.pillars,
    },
    provenanceSection: {
      eyebrow:
        raw.provenanceSection?.eyebrow ?? DEFAULT_WHY_MINDFREE_CMS_DATA.provenanceSection.eyebrow,
      title: raw.provenanceSection?.title ?? DEFAULT_WHY_MINDFREE_CMS_DATA.provenanceSection.title,
      items:
        Array.isArray(raw.provenanceSection?.items) && raw.provenanceSection.items.length > 0
          ? raw.provenanceSection.items
          : DEFAULT_WHY_MINDFREE_CMS_DATA.provenanceSection.items,
    },
    ctaBanner: {
      title: raw.ctaBanner?.title ?? DEFAULT_WHY_MINDFREE_CMS_DATA.ctaBanner.title,
      subtitle: raw.ctaBanner?.subtitle ?? DEFAULT_WHY_MINDFREE_CMS_DATA.ctaBanner.subtitle,
      primaryButtonText:
        raw.ctaBanner?.primaryButtonText ??
        DEFAULT_WHY_MINDFREE_CMS_DATA.ctaBanner.primaryButtonText,
      secondaryButtonText:
        raw.ctaBanner?.secondaryButtonText ??
        DEFAULT_WHY_MINDFREE_CMS_DATA.ctaBanner.secondaryButtonText,
    },
  };
}

function doubleFormattedRupeeString(str: string): string {
  const numeric = Number(String(str || '').replace(/[^0-9.]/g, ''));
  if (!numeric || isNaN(numeric)) return str;
  return `₹${Math.round(numeric * 2).toLocaleString('en-IN')}`;
}

export const HomePageContentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [homePageData, setHomePageData] = useState<HomePageCMSData>(() => {
    try {
      const cached = localStorage.getItem(STORAGE_CACHE_KEY);
      if (cached) {
        return mergeHomePageData(JSON.parse(cached));
      }
      const legacyHome = localStorage.getItem(LEGACY_HOME_CACHE_KEY);
      if (legacyHome) {
        const parsed = mergeHomePageData(JSON.parse(legacyHome));
        const doubledHome: HomePageCMSData = {
          ...parsed,
          shopByRoom: {
            ...parsed.shopByRoom,
            rooms: parsed.shopByRoom.rooms.map((rm) => ({
              ...rm,
              product: {
                ...rm.product,
                mrpFormatted: doubleFormattedRupeeString(rm.product.mrpFormatted),
                priceFormatted: doubleFormattedRupeeString(rm.product.priceFormatted),
              },
            })),
          },
        };
        localStorage.removeItem(LEGACY_HOME_CACHE_KEY);
        localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(doubledHome));
        return doubledHome;
      }
    } catch {
      // ignore localStorage parse errors
    }
    return DEFAULT_HOMEPAGE_CMS_DATA;
  });

  const [mattressesData, setMattressesData] = useState<MattressesCMSData>(() => {
    try {
      // Free up localStorage space by removing obsolete legacy keys
      localStorage.removeItem('mindfree_mattresses_cms_v1');
      localStorage.removeItem('mindfree_mattresses_cms_v2');

      const v5Cached = localStorage.getItem(MATTRESSES_CACHE_KEY);
      if (v5Cached) {
        localStorage.removeItem(LEGACY_MATTRESSES_V4_KEY);
        localStorage.removeItem(LEGACY_MATTRESSES_CACHE_KEY);
        return mergeMattressesData(JSON.parse(v5Cached), [], false);
      }

      const v4OrV3Raw =
        localStorage.getItem(LEGACY_MATTRESSES_V4_KEY) ||
        localStorage.getItem(LEGACY_MATTRESSES_CACHE_KEY);
      if (v4OrV3Raw) {
        const merged = mergeMattressesData(JSON.parse(v4OrV3Raw), [], true);
        const doubledModels = merged.mattressModels.map((m) => ({
          ...m,
          startingPrice: Number(((m.startingPrice || 0) * 2).toFixed(2)),
          maxPrice: Number(((m.maxPrice || 0) * 2).toFixed(2)),
          priceMatrix: Array.isArray(m.priceMatrix)
            ? m.priceMatrix.map((cell) => ({
                ...cell,
                mrp: Number(((cell.mrp || 0) * 2).toFixed(2)),
              }))
            : [],
        }));
        const nextMat: MattressesCMSData = {
          ...merged,
          mattressModels: doubledModels,
        };
        localStorage.removeItem(LEGACY_MATTRESSES_V4_KEY);
        localStorage.removeItem(LEGACY_MATTRESSES_CACHE_KEY);
        localStorage.setItem(MATTRESSES_CACHE_KEY, JSON.stringify(nextMat));
        return nextMat;
      }
    } catch {
      // ignore
    }
    return DEFAULT_MATTRESSES_CMS_DATA;
  });

  const [pillowsData, setPillowsData] = useState<PillowsCMSData>(() => {
    try {
      const cached = localStorage.getItem(PILLOWS_CACHE_KEY);
      if (cached) {
        localStorage.removeItem(LEGACY_PILLOWS_CACHE_KEY);
        return mergePillowsData(JSON.parse(cached));
      }
      const legacyPil = localStorage.getItem(LEGACY_PILLOWS_CACHE_KEY);
      if (legacyPil) {
        const mergedPil = mergePillowsData(JSON.parse(legacyPil));
        const doubledPil: PillowsCMSData = {
          ...mergedPil,
          pillowModels: mergedPil.pillowModels.map((p) => ({
            ...p,
            price: Math.round((p.price || 0) * 2),
            originalPrice: Math.round((p.originalPrice || 0) * 2),
            sizes: Array.isArray(p.sizes)
              ? p.sizes.map((s) => ({
                  ...s,
                  price: Math.round((s.price || 0) * 2),
                }))
              : [],
          })),
        };
        localStorage.removeItem(LEGACY_PILLOWS_CACHE_KEY);
        localStorage.setItem(PILLOWS_CACHE_KEY, JSON.stringify(doubledPil));
        return doubledPil;
      }
    } catch {
      // ignore
    }
    return DEFAULT_PILLOWS_CMS_DATA;
  });

  const [footerData, setFooterData] = useState<FooterCMSData>(() => {
    try {
      const cached = localStorage.getItem(FOOTER_CACHE_KEY);
      if (cached) {
        return mergeFooterData(JSON.parse(cached));
      }
    } catch {
      // ignore
    }
    return DEFAULT_FOOTER_CMS_DATA;
  });

  const [contactData, setContactData] = useState<ContactPageCMSData>(() => {
    try {
      const cached = localStorage.getItem(CONTACT_CACHE_KEY);
      if (cached) {
        return mergeContactData(JSON.parse(cached));
      }
    } catch {
      // ignore
    }
    return DEFAULT_CONTACT_CMS_DATA;
  });

  const [whyMindfreeData, setWhyMindfreeData] = useState<WhyMindfreeCMSData>(() => {
    try {
      const cached = localStorage.getItem(WHY_MINDFREE_CACHE_KEY);
      if (cached) {
        return mergeWhyMindfreeData(JSON.parse(cached));
      }
    } catch {
      // ignore
    }
    return DEFAULT_WHY_MINDFREE_CMS_DATA;
  });

  const [isSavingHomePage, setIsSavingHomePage] = useState(false);
  const [isSavingMattresses, setIsSavingMattresses] = useState(false);
  const [isSavingPillows, setIsSavingPillows] = useState(false);
  const [isSavingFooter, setIsSavingFooter] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const [isSavingWhyMindfree, setIsSavingWhyMindfree] = useState(false);

  const refreshHomePageData = useCallback(async () => {
    try {
      const [rows, pgProducts] = await Promise.all([
        fetchSiteContentFromPg(),
        fetchProductsFromPg(),
      ]);
      const homeRow = rows.find((r) => r.section_key === 'home_page_cms');
      if (homeRow && homeRow.content_json && Object.keys(homeRow.content_json).length > 0) {
        const merged = mergeHomePageData(homeRow.content_json as Partial<HomePageCMSData>);
        setHomePageData(merged);
        await saveToHdStorage(STORAGE_CACHE_KEY, merged);
      }

      const matRow = rows.find((r) => r.section_key === 'mattresses_cms');
      const hasMatRow =
        matRow && matRow.content_json && Object.keys(matRow.content_json).length > 0;
      const hasPgProducts = Array.isArray(pgProducts) && pgProducts.length > 0;

      if (hasMatRow || hasPgProducts) {
        let fallbackLocalMat: Partial<MattressesCMSData> | null = null;
        try {
          const cachedMatStr = localStorage.getItem(MATTRESSES_CACHE_KEY);
          if (cachedMatStr) {
            fallbackLocalMat = JSON.parse(cachedMatStr);
          }
        } catch {
          // ignore
        }
        const rawMat = hasMatRow
          ? (matRow.content_json as Partial<MattressesCMSData>)
          : fallbackLocalMat;
        const mergedMat = mergeMattressesData(rawMat, pgProducts || []);
        setMattressesData(mergedMat);
        await saveToHdStorage(MATTRESSES_CACHE_KEY, mergedMat);
      }

      const pilRow = rows.find((r) => r.section_key === 'pillows_cms');
      if (pilRow && pilRow.content_json && Object.keys(pilRow.content_json).length > 0) {
        const mergedPil = mergePillowsData(pilRow.content_json as Partial<PillowsCMSData>);
        setPillowsData(mergedPil);
        await saveToHdStorage(PILLOWS_CACHE_KEY, mergedPil);
      }

      const footerRow = rows.find((r) => r.section_key === 'footer_cms');
      if (
        footerRow &&
        footerRow.content_json &&
        Object.keys(footerRow.content_json).length > 0
      ) {
        const mergedFooter = mergeFooterData(footerRow.content_json as Partial<FooterCMSData>);
        setFooterData(mergedFooter);
        await saveToHdStorage(FOOTER_CACHE_KEY, mergedFooter);
      }

      const contactRow = rows.find((r) => r.section_key === 'contact_cms');
      if (
        contactRow &&
        contactRow.content_json &&
        Object.keys(contactRow.content_json).length > 0
      ) {
        const mergedContact = mergeContactData(
          contactRow.content_json as Partial<ContactPageCMSData>
        );
        setContactData(mergedContact);
        await saveToHdStorage(CONTACT_CACHE_KEY, mergedContact);
      }

      const whyRow = rows.find((r) => r.section_key === 'why_mindfree_cms');
      if (whyRow && whyRow.content_json && Object.keys(whyRow.content_json).length > 0) {
        const mergedWhy = mergeWhyMindfreeData(whyRow.content_json as Partial<WhyMindfreeCMSData>);
        setWhyMindfreeData(mergedWhy);
        await saveToHdStorage(WHY_MINDFREE_CACHE_KEY, mergedWhy);
      }
    } catch {
      // fallback to state
    }
  }, []);

  useEffect(() => {
    // Hydrate from IndexedDB first (instant local cache), then always fetch latest shared data from PostgreSQL API
    (async () => {
      const [idbHome, idbMat, idbPil, idbFooter, idbContact, idbWhy] = await Promise.all([
        loadFromHdStorage<Partial<HomePageCMSData>>(STORAGE_CACHE_KEY),
        loadFromHdStorage<Partial<MattressesCMSData>>(MATTRESSES_CACHE_KEY),
        loadFromHdStorage<Partial<PillowsCMSData>>(PILLOWS_CACHE_KEY),
        loadFromHdStorage<Partial<FooterCMSData>>(FOOTER_CACHE_KEY),
        loadFromHdStorage<Partial<ContactPageCMSData>>(CONTACT_CACHE_KEY),
        loadFromHdStorage<Partial<WhyMindfreeCMSData>>(WHY_MINDFREE_CACHE_KEY),
      ]);
      if (idbHome) setHomePageData(mergeHomePageData(idbHome));
      if (idbMat) setMattressesData(mergeMattressesData(idbMat, [], false));
      if (idbPil) setPillowsData(mergePillowsData(idbPil));
      if (idbFooter) setFooterData(mergeFooterData(idbFooter));
      if (idbContact) setContactData(mergeContactData(idbContact));
      if (idbWhy) setWhyMindfreeData(mergeWhyMindfreeData(idbWhy));
      await refreshHomePageData();
    })();

    // Auto-refresh from PostgreSQL when a user returns to the browser tab so all users stay synced
    let lastSyncAt = Date.now();
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastSyncAt > 10000) {
        lastSyncAt = Date.now();
        refreshHomePageData();
      }
    };
    window.addEventListener('focus', handleVisibilityOrFocus);
    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    const pollTimer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        refreshHomePageData();
      }
    }, 30000);
    return () => {
      clearInterval(pollTimer);
      window.removeEventListener('focus', handleVisibilityOrFocus);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
    };
  }, [refreshHomePageData]);

  // Listen for cross-tab localStorage updates so Storefront tabs update immediately when Admin tab saves
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (!e.newValue) return;
      try {
        if (e.key === STORAGE_CACHE_KEY) {
          setHomePageData(mergeHomePageData(JSON.parse(e.newValue)));
        } else if (e.key === MATTRESSES_CACHE_KEY) {
          setMattressesData(mergeMattressesData(JSON.parse(e.newValue)));
        } else if (e.key === PILLOWS_CACHE_KEY) {
          setPillowsData(mergePillowsData(JSON.parse(e.newValue)));
        } else if (e.key === FOOTER_CACHE_KEY) {
          setFooterData(mergeFooterData(JSON.parse(e.newValue)));
        } else if (e.key === CONTACT_CACHE_KEY) {
          setContactData(mergeContactData(JSON.parse(e.newValue)));
        } else if (e.key === WHY_MINDFREE_CACHE_KEY) {
          setWhyMindfreeData(mergeWhyMindfreeData(JSON.parse(e.newValue)));
        }
      } catch {
        // ignore
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const saveHomePageData = useCallback(async (nextData: HomePageCMSData): Promise<boolean> => {
    setIsSavingHomePage(true);
    try {
      const merged = mergeHomePageData(nextData);
      setHomePageData(merged);
      await saveToHdStorage(STORAGE_CACHE_KEY, merged);
      const saved = await saveSiteContentToPg({
        section_key: 'home_page_cms',
        title: 'Complete Home Page Configuration',
        subtitle: 'Hero Slides, Feature Strip, Shop By Room, Catalogue Header, Quiz Banner & Reviews',
        cta_text: merged.heroSlides[0]?.primaryCtaText || 'Explore Mattresses',
        image_url: merged.heroSlides[0]?.imageJpg || '/images/hero-banner-1.jpg',
        content_json: merged as unknown as Record<string, unknown>,
      });
      return Boolean(saved);
    } finally {
      setIsSavingHomePage(false);
    }
  }, []);

  const resetHomePageData = useCallback(async (): Promise<boolean> => {
    return saveHomePageData(DEFAULT_HOMEPAGE_CMS_DATA);
  }, [saveHomePageData]);

  const saveMattressesData = useCallback(async (nextData: MattressesCMSData): Promise<boolean> => {
    setIsSavingMattresses(true);
    try {
      const merged = mergeMattressesData(nextData);
      setMattressesData(merged);
      await saveToHdStorage(MATTRESSES_CACHE_KEY, merged);
      const saved = await saveSiteContentToPg({
        section_key: 'mattresses_cms',
        title: 'Complete Mattresses & Mega-Menu Dropdown Configuration',
        subtitle: `${merged.mattressModels.length} Mattress Models, 5-Column Mega Menu & Category Tabs`,
        cta_text: merged.megaMenu.campaign.ctaText,
        image_url: merged.megaMenu.campaign.image,
        content_json: merged as unknown as Record<string, unknown>,
      });
      return Boolean(saved);
    } finally {
      setIsSavingMattresses(false);
    }
  }, []);

  const resetMattressesData = useCallback(async (): Promise<boolean> => {
    return saveMattressesData(DEFAULT_MATTRESSES_CMS_DATA);
  }, [saveMattressesData]);

  const savePillowsData = useCallback(async (nextData: PillowsCMSData): Promise<boolean> => {
    setIsSavingPillows(true);
    try {
      const merged = mergePillowsData(nextData);
      setPillowsData(merged);
      await saveToHdStorage(PILLOWS_CACHE_KEY, merged);
      const saved = await saveSiteContentToPg({
        section_key: 'pillows_cms',
        title: 'Complete Pillows & Dropdown Configuration',
        subtitle: `${merged.pillowModels.length} Ergonomic Pillows, Hero Banner, Posture Guide & Dropdown Links`,
        cta_text: merged.postureGuide.ctaText,
        image_url: merged.pillowModels[0]?.image || '/images/pillows/pillow-cervical.jpg',
        content_json: merged as unknown as Record<string, unknown>,
      });
      return Boolean(saved);
    } finally {
      setIsSavingPillows(false);
    }
  }, []);

  const resetPillowsData = useCallback(async (): Promise<boolean> => {
    return savePillowsData(DEFAULT_PILLOWS_CMS_DATA);
  }, [savePillowsData]);

  const saveFooterData = useCallback(async (nextData: FooterCMSData): Promise<boolean> => {
    setIsSavingFooter(true);
    try {
      const merged = mergeFooterData(nextData);
      setFooterData(merged);
      await saveToHdStorage(FOOTER_CACHE_KEY, merged);
      const saved = await saveSiteContentToPg({
        section_key: 'footer_cms',
        title: 'Complete Footer Configuration',
        subtitle:
          'Brand Promise Badges, Newsletter, Brand Identity, 3 Navigation Columns, Concierge & Legal Bar',
        cta_text: merged.newsletter.buttonText,
        image_url: merged.brand.logoUrl,
        content_json: merged as unknown as Record<string, unknown>,
      });
      return Boolean(saved);
    } finally {
      setIsSavingFooter(false);
    }
  }, []);

  const resetFooterData = useCallback(async (): Promise<boolean> => {
    return saveFooterData(DEFAULT_FOOTER_CMS_DATA);
  }, [saveFooterData]);

  const saveContactData = useCallback(async (nextData: ContactPageCMSData): Promise<boolean> => {
    setIsSavingContact(true);
    try {
      const merged = mergeContactData(nextData);
      setContactData(merged);
      await saveToHdStorage(CONTACT_CACHE_KEY, merged);
      const saved = await saveSiteContentToPg({
        section_key: 'contact_cms',
        title: 'Complete Contact Us Page Configuration',
        subtitle:
          'Hero Banner, 4 Reassurance Badges, Direct Concierge Channels (Phone, WhatsApp, Email, HQ) & Inquiry Form',
        cta_text: merged.formConfig.submitButtonText,
        image_url: '/images/hero-banner-1.jpg',
        content_json: merged as unknown as Record<string, unknown>,
      });
      return Boolean(saved);
    } finally {
      setIsSavingContact(false);
    }
  }, []);

  const resetContactData = useCallback(async (): Promise<boolean> => {
    return saveContactData(DEFAULT_CONTACT_CMS_DATA);
  }, [saveContactData]);

  const saveWhyMindfreeData = useCallback(async (nextData: WhyMindfreeCMSData): Promise<boolean> => {
    setIsSavingWhyMindfree(true);
    try {
      const merged = mergeWhyMindfreeData(nextData);
      setWhyMindfreeData(merged);
      await saveToHdStorage(WHY_MINDFREE_CACHE_KEY, merged);
      const saved = await saveSiteContentToPg({
        section_key: 'why_mindfree_cms',
        title: 'Complete Why Mindfree Page & Dropdown Configuration',
        subtitle:
          'Dropdown Links, Hero Banner, Manifesto, 4 Craftsmanship Pillars, 3 Raw Material Provenance Cards & CTA Banner',
        cta_text: merged.ctaBanner.primaryButtonText,
        image_url: merged.manifesto.image,
        content_json: merged as unknown as Record<string, unknown>,
      });
      return Boolean(saved);
    } finally {
      setIsSavingWhyMindfree(false);
    }
  }, []);

  const resetWhyMindfreeData = useCallback(async (): Promise<boolean> => {
    return saveWhyMindfreeData(DEFAULT_WHY_MINDFREE_CMS_DATA);
  }, [saveWhyMindfreeData]);

  return (
    <HomePageContentContext.Provider
      value={{
        homePageData,
        isSavingHomePage,
        saveHomePageData,
        resetHomePageData,
        refreshHomePageData,
        mattressesData,
        isSavingMattresses,
        saveMattressesData,
        resetMattressesData,
        pillowsData,
        isSavingPillows,
        savePillowsData,
        resetPillowsData,
        footerData,
        isSavingFooter,
        saveFooterData,
        resetFooterData,
        contactData,
        isSavingContact,
        saveContactData,
        resetContactData,
        whyMindfreeData,
        isSavingWhyMindfree,
        saveWhyMindfreeData,
        resetWhyMindfreeData,
      }}
    >
      {children}
    </HomePageContentContext.Provider>
  );
};

export function useHomePageContent(): HomePageContentContextType {
  const ctx = useContext(HomePageContentContext);
  if (!ctx) {
    throw new Error('useHomePageContent must be used within a HomePageContentProvider');
  }
  return ctx;
}
