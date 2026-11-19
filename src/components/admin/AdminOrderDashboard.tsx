import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Package,
  Clock,
  Truck,
  CheckCircle2,
  Search,
  ArrowLeft,
  X,
  MapPin,
  Phone,
  Mail,
  RefreshCw,
  ChevronDown,
  Sparkles,
  Database,
  HardDrive,
  Plus,
  Trash2,
  Upload,
  FileText,
  Layers,
  Copy,
  Check,
  Home,
  RotateCcw,
  Save,
  Image as ImageIcon,
  Lock,
  Eye,
  EyeOff,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { useNavigation } from '../../context/NavigationContext';
import {
  useHomePageContent,
  type HomePageCMSData,
  type MattressesCMSData,
  type PillowsCMSData,
  type FooterCMSData,
  type ContactPageCMSData,
  type WhyMindfreeCMSData,
} from '../../context/HomePageContentContext';
import type { AccessoryItem } from '../../data/accessoriesData';
import {
  STANDARD_CATALOGUE_SIZES,
  type CatalogueCategoryId,
  type CatalogueMattressProduct,
  type TopFinishStyle,
  type ConstructionFamily,
} from '../../data/bedPriceCatalogueData';
import {
  getAllOrders,
  updateOrderStatus,
} from '../../services/orderService';
import type {
  OrderRecord,
  OrderStatusType,
} from '../../services/orderService';
import {
  fetchPgHealth,
  fetchOrdersFromPg,
  saveOrderToPg,
  updateOrderStatusInPg,
  createProductInPg,
  deleteProductFromPg,
  fetchBucketsFromPg,
  createBucketInPg,
  fetchStorageObjectsFromPg,
  uploadImageToPgStorage,
  deleteStorageObjectFromPg,
  fetchSiteContentFromPg,
  saveSiteContentToPg,
  type PgHealthResponse,
  type PgStorageBucket,
  type PgStorageObject,
  type PgSiteContentRecord,
} from '../../services/postgresApi';

type AdminTab = 'homepage' | 'products' | 'pillows' | 'why-mindfree' | 'footer' | 'contact' | 'orders' | 'storage' | 'content';
type HomeEditorSection = 'hero' | 'rooms' | 'catalogue-quiz' | 'reviews';
type MattressesEditorSection = 'quick-grid' | 'models' | 'megamenu' | 'categories';
type MattressDetailStep = 'basic' | 'features-layers' | 'price-matrix';
type PillowsEditorSection = 'quick-grid' | 'models' | 'hero-posture' | 'dropdown';
type FooterEditorSection = 'promises-newsletter' | 'brand-socials' | 'nav-columns' | 'concierge-legal';
type ContactEditorSection = 'hero-reassurance' | 'channels' | 'inquiry-form' | 'inquiries-inbox';
type WhyMindfreeEditorSection = 'dropdown-hero' | 'manifesto' | 'pillars' | 'provenance-cta';

interface CustomerInquiryRecord {
  id: string | number;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  submittedAt: string;
}

interface PendingProductDeletion {
  type: 'mattress' | 'pillow';
  id: string;
  name: string;
  image: string;
  price: number;
  index: number;
}

export const AdminOrderDashboard: React.FC = () => {
  const { navigateToHome } = useNavigation();
  const {
    homePageData,
    isSavingHomePage,
    saveHomePageData,
    resetHomePageData,
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
  } = useHomePageContent();

  const [activeTab, setActiveTab] = useState<AdminTab>('homepage');
  const [homeSubTab, setHomeSubTab] = useState<HomeEditorSection>('hero');
  const [draftHome, setDraftHome] = useState<HomePageCMSData>(homePageData);

  const [matSubTab, setMatSubTab] = useState<MattressesEditorSection>('quick-grid');
  const [matDetailStep, setMatDetailStep] = useState<MattressDetailStep>('basic');
  const [matSearchQuery, setMatSearchQuery] = useState<string>('');
  const [matCategoryFilter, setMatCategoryFilter] = useState<'all' | CatalogueCategoryId>('all');
  const [draftMattresses, setDraftMattresses] = useState<MattressesCMSData>(mattressesData);
  const [selectedModelIdx, setSelectedModelIdx] = useState<number>(0);
  const [isCreatingNewMattress, setIsCreatingNewMattress] = useState<boolean>(false);

  const [pilSubTab, setPilSubTab] = useState<PillowsEditorSection>('quick-grid');
  const [draftPillows, setDraftPillows] = useState<PillowsCMSData>(pillowsData);
  const [selectedPillowIdx, setSelectedPillowIdx] = useState<number>(0);
  const [isCreatingNewPillow, setIsCreatingNewPillow] = useState<boolean>(false);

  const [footerSubTab, setFooterSubTab] = useState<FooterEditorSection>('promises-newsletter');
  const [draftFooter, setDraftFooter] = useState<FooterCMSData>(footerData);
  const [contactSubTab, setContactSubTab] = useState<ContactEditorSection>('hero-reassurance');
  const [draftContact, setDraftContact] = useState<ContactPageCMSData>(contactData);
  const [whySubTab, setWhySubTab] = useState<WhyMindfreeEditorSection>('dropdown-hero');
  const [draftWhyMindfree, setDraftWhyMindfree] = useState<WhyMindfreeCMSData>(whyMindfreeData);
  const [inquiriesList, setInquiriesList] = useState<CustomerInquiryRecord[]>([]);
  const [uploadingFieldKey, setUploadingFieldKey] = useState<string | null>(null);
  const [pendingUploadAutoSave, setPendingUploadAutoSave] = useState<boolean>(false);
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState<PendingProductDeletion | null>(
    null
  );

  // Admin Authentication State
  const ADMIN_AUTH_STORAGE_KEY = 'mindfree_admin_session_v1';
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ADMIN_AUTH_STORAGE_KEY) === 'authenticated';
    } catch {
      return false;
    }
  });
  const [adminLoginUserId, setAdminLoginUserId] = useState<string>('');
  const [adminLoginPassword, setAdminLoginPassword] = useState<string>('');
  const [showAdminPassword, setShowAdminPassword] = useState<boolean>(false);
  const [adminLoginError, setAdminLoginError] = useState<string | null>(null);

  const handleAdminLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = adminLoginUserId.trim().toLowerCase();
    const cleanPass = adminLoginPassword.trim();
    if (
      (cleanId === 'mindfreematress@gmail.com' || cleanId === 'mindfreemattress@gmail.com') &&
      cleanPass === 'mindfree@2026'
    ) {
      setIsAdminAuthenticated(true);
      setAdminLoginError(null);
      try {
        localStorage.setItem(ADMIN_AUTH_STORAGE_KEY, 'authenticated');
      } catch {
        // ignore
      }
    } else {
      setAdminLoginError('Invalid Admin User ID or Password. Please check your credentials and try again.');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthenticated(false);
    setAdminLoginUserId('');
    setAdminLoginPassword('');
    setAdminLoginError(null);
    try {
      localStorage.removeItem(ADMIN_AUTH_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    setDraftHome(homePageData);
  }, [homePageData]);

  useEffect(() => {
    setDraftMattresses(mattressesData);
  }, [mattressesData]);

  useEffect(() => {
    setDraftPillows(pillowsData);
  }, [pillowsData]);

  useEffect(() => {
    setDraftFooter(footerData);
  }, [footerData]);

  useEffect(() => {
    setDraftContact(contactData);
  }, [contactData]);

  useEffect(() => {
    setDraftWhyMindfree(whyMindfreeData);
  }, [whyMindfreeData]);

  const loadCustomerInquiries = useCallback(async () => {
    let localItems: CustomerInquiryRecord[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem('mindfree_contact_enquiries_v1') || '[]');
      if (Array.isArray(raw)) {
        localItems = raw.map((r: Record<string, unknown>, idx: number) => ({
          id: String(r.id || `LOC-${idx}`),
          name: String(r.name || r.full_name || 'Guest'),
          email: String(r.email || ''),
          phone: String(r.phone || ''),
          subject: String(r.subject || 'General Inquiry'),
          message: String(r.message || ''),
          submittedAt: String(r.submittedAt || r.created_at || new Date().toISOString()),
        }));
      }
    } catch {
      // ignore
    }
    try {
      const res = await fetch('/api/inquiries');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          const apiItems: CustomerInquiryRecord[] = data.map((r: Record<string, unknown>) => ({
            id: String(r.id || ''),
            name: String(r.full_name || r.name || 'Guest'),
            email: String(r.email || ''),
            phone: String(r.phone || ''),
            subject: String(r.subject || 'General Inquiry'),
            message: String(r.message || ''),
            submittedAt: String(r.created_at || r.submittedAt || new Date().toISOString()),
          }));
          setInquiriesList(apiItems.length > 0 ? apiItems : localItems);
          return;
        }
      }
    } catch {
      // fallback to local
    }
    setInquiriesList(localItems);
  }, []);

  useEffect(() => {
    loadCustomerInquiries();
  }, [loadCustomerInquiries]);
  const [pgHealth, setPgHealth] = useState<PgHealthResponse | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // Orders state
  const [orders, setOrders] = useState<OrderRecord[]>(() => getAllOrders());
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | OrderStatusType>('All');
  const [selectedOrder, setSelectedOrder] = useState<OrderRecord | null>(null);
  const [trackingStatusDraft, setTrackingStatusDraft] = useState<OrderStatusType>('Confirmed');
  const [trackingNumberDraft, setTrackingNumberDraft] = useState('');
  const [courierPartnerDraft, setCourierPartnerDraft] = useState('');
  const [estimatedDeliveryDraft, setEstimatedDeliveryDraft] = useState('');
  const [trackingNoteDraft, setTrackingNoteDraft] = useState('');
  const [isUpdatingTracking, setIsUpdatingTracking] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (selectedOrder) {
      setTrackingStatusDraft(selectedOrder.orderStatus);
      setTrackingNumberDraft(selectedOrder.trackingNumber || '');
      setCourierPartnerDraft(
        selectedOrder.courierPartner || 'Mindfree Dedicated White-Glove Fleet'
      );
      setEstimatedDeliveryDraft(selectedOrder.estimatedDelivery || '');
      setTrackingNoteDraft('');
    }
  }, [selectedOrder]);

  // Storage Buckets & Objects state (PostgreSQL storage_buckets & storage_objects)
  const [buckets, setBuckets] = useState<PgStorageBucket[]>([]);
  const [selectedBucketId, setSelectedBucketId] = useState<string>('media-uploads');
  const [storageObjects, setStorageObjects] = useState<PgStorageObject[]>([]);
  const [newBucketName, setNewBucketName] = useState('');
  const [newBucketDesc, setNewBucketDesc] = useState('');
  const [uploadAltText, setUploadAltText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Site Content CMS state (PostgreSQL site_content table)
  const [siteContents, setSiteContents] = useState<PgSiteContentRecord[]>([]);
  const [cmsKey, setCmsKey] = useState('hero-primary');
  const [cmsTitle, setCmsTitle] = useState('ORTHOPEDIC COMFORT THAT SUPPORTS YOUR SPINE');
  const [cmsSubtitle, setCmsSubtitle] = useState(
    'Engineered for Indian body contours and climate with 100-night risk-free trial.'
  );
  const [cmsBadge, setCmsBadge] = useState('MINDFREE SIGNATURE SERIES');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3800);
  };

  // Synchronize all data from PostgreSQL (localhost:5432 / mindf31)
  const syncAllFromPostgres = useCallback(async () => {
    setIsSyncing(true);
    try {
      const [health, remoteOrders, remoteBuckets, remoteObjects, remoteContent] =
        await Promise.all([
          fetchPgHealth(),
          fetchOrdersFromPg(),
          fetchBucketsFromPg(),
          fetchStorageObjectsFromPg(),
          fetchSiteContentFromPg(),
        ]);

      if (health) setPgHealth(health);
      if (remoteOrders && remoteOrders.length > 0) {
        setOrders(remoteOrders);
        try {
          localStorage.setItem('mindfree_orders_v1', JSON.stringify(remoteOrders));
        } catch {
          // ignore
        }
      }
      if (remoteBuckets) setBuckets(remoteBuckets);
      if (remoteObjects) setStorageObjects(remoteObjects);
      if (remoteContent) setSiteContents(remoteContent);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    syncAllFromPostgres();
  }, [syncAllFromPostgres]);

  // Reload orders & tables manually
  const refreshOrders = async () => {
    await syncAllFromPostgres();
    showToast('All data synchronized.');
  };

  // Status & tracking update handler
  const handleStatusChange = async (
    orderId: string,
    newStatus: OrderStatusType,
    customFields?: {
      note?: string;
      trackingNumber?: string;
      courierPartner?: string;
      estimatedDelivery?: string;
    }
  ) => {
    setIsUpdatingTracking(true);
    try {
      const targetOrder = orders.find(
        (o) => o.orderId.toUpperCase() === orderId.toUpperCase().trim()
      );
      const res = updateOrderStatus(
        orderId,
        newStatus,
        customFields?.note,
        'Atelier Master Craftsman',
        customFields?.courierPartner,
        customFields?.trackingNumber,
        customFields?.trackingNumber,
        customFields?.estimatedDelivery
      );

      let updatedPg = await updateOrderStatusInPg(orderId, newStatus, customFields?.note, {
        courierPartner: customFields?.courierPartner,
        trackingNumber: customFields?.trackingNumber,
        courierWaybill: customFields?.trackingNumber,
        estimatedDelivery: customFields?.estimatedDelivery,
        updatedBy: 'Atelier Master Craftsman',
      });

      if (!updatedPg && targetOrder) {
        const latestLocal = getAllOrders().find(
          (o) => o.orderId.toUpperCase() === orderId.toUpperCase().trim()
        );
        if (latestLocal) {
          updatedPg = await saveOrderToPg(latestLocal);
        }
      }

      if (res.success || updatedPg) {
        const freshOrders = (await fetchOrdersFromPg()) || getAllOrders();
        setOrders(freshOrders);
        try {
          localStorage.setItem('mindfree_orders_v1', JSON.stringify(freshOrders));
          window.dispatchEvent(new CustomEvent('mindfree-orders-updated'));
        } catch {
          // ignore
        }
        if (selectedOrder && selectedOrder.orderId.toUpperCase() === orderId.toUpperCase()) {
          const updatedMatch = freshOrders.find(
            (o) => o.orderId.toUpperCase() === orderId.toUpperCase()
          );
          if (updatedMatch) {
            setSelectedOrder(updatedMatch);
          }
        }
        showToast(
          `Order ${orderId} tracking updated (${newStatus}) for ${targetOrder?.customer.fullName || 'customer'}.`
        );
      } else {
        showToast(res.message || 'Status update failed.');
      }
    } finally {
      setIsUpdatingTracking(false);
    }
  };

  const handlePostOrderTrackingUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    await handleStatusChange(selectedOrder.orderId, trackingStatusDraft, {
      note: trackingNoteDraft,
      trackingNumber: trackingNumberDraft,
      courierPartner: courierPartnerDraft,
      estimatedDelivery: estimatedDeliveryDraft,
    });
    setTrackingNoteDraft('');
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    const ok = await deleteProductFromPg(id);
    if (ok) {
      await syncAllFromPostgres();
      showToast(`Deleted "${name}".`);
    }
  };

  const handleConfirmDeleteProduct = async () => {
    if (!pendingDeleteProduct) return;
    const target = pendingDeleteProduct;
    setPendingDeleteProduct(null);

    if (target.type === 'mattress') {
      const nextModels = draftMattresses.mattressModels.filter(
        (_, i) => i !== target.index
      );
      const nextDraft = {
        ...draftMattresses,
        mattressModels: nextModels,
      };
      setDraftMattresses(nextDraft);
      setSelectedModelIdx(Math.max(0, Math.min(selectedModelIdx, nextModels.length - 1)));
      setIsCreatingNewMattress(false);
      await saveMattressesData(nextDraft);
      await handleDeleteProduct(target.id, target.name);
      showToast(`Deleted mattress "${target.name}".`);
    } else {
      const nextPillows = draftPillows.pillowModels.filter(
        (_, i) => i !== target.index
      );
      const nextDraft = {
        ...draftPillows,
        pillowModels: nextPillows,
      };
      setDraftPillows(nextDraft);
      setSelectedPillowIdx(Math.max(0, Math.min(selectedPillowIdx, nextPillows.length - 1)));
      setIsCreatingNewPillow(false);
      await savePillowsData(nextDraft);
      showToast(`Deleted pillow "${target.name}".`);
    }
  };

  // Create Storage Bucket
  const handleCreateBucket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBucketName.trim()) return;
    const slug = newBucketName.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const created = await createBucketInPg({
      id: slug,
      name: slug,
      description: newBucketDesc.trim() || 'Custom media bucket',
    });
    if (created) {
      setNewBucketName('');
      setNewBucketDesc('');
      setSelectedBucketId(created.id);
      await syncAllFromPostgres();
      showToast(`Bucket "${created.id}" created.`);
    }
  };

  // Upload Image File
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const optimizedDataUrl = await optimizeImageFileToDataUrl(file);
      const uploaded = await uploadImageToPgStorage({
        bucket_id: selectedBucketId,
        file_name: file.name,
        mime_type: file.type || 'image/png',
        base64_data: optimizedDataUrl,
        alt_text: uploadAltText.trim() || file.name,
      });
      if (uploaded) {
        setUploadAltText('');
        await syncAllFromPostgres();
        showToast(`Uploaded "${uploaded.file_name}" to bucket "${selectedBucketId}".`);
      } else {
        const localObj: PgStorageObject = {
          id: Date.now(),
          bucket_id: selectedBucketId,
          file_name: file.name,
          mime_type: file.type || 'image/png',
          size_bytes: file.size,
          public_url: optimizedDataUrl,
          alt_text: uploadAltText.trim() || file.name,
          uploaded_by: 'Mindfree Admin',
          created_at: new Date().toISOString(),
        };
        setStorageObjects((prev) => [localObj, ...prev]);
        setUploadAltText('');
        showToast(`Uploaded "${file.name}" and linked live.`);
      }
    } catch {
      showToast('Error reading image file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteStorageObject = async (id: number, fileName: string) => {
    const ok = await deleteStorageObjectFromPg(id);
    if (ok) {
      await syncAllFromPostgres();
      showToast(`Removed "${fileName}" from storage.`);
    }
  };

  // Save Site Content
  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmsKey.trim() || !cmsTitle.trim()) return;
    const saved = await saveSiteContentToPg({
      section_key: cmsKey.trim(),
      title: cmsTitle.trim(),
      subtitle: cmsSubtitle.trim(),
      badge_text: cmsBadge.trim(),
      cta_text: 'Shop Mattresses',
      cta_link: '#catalogue-grid',
      image_url: '/images/hero-banner-1.png',
    });
    if (saved) {
      await syncAllFromPostgres();
      showToast(`Updated "${saved.section_key}".`);
    }
  };

  // Preserve 100% original uploaded image quality while keeping single-file payload within serverless 4.5MB limit
  const optimizeImageFileToDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.onload = () => {
        const rawDataUrl = String(reader.result || '');
        // Return the exact original file Data URL untouched up to 3.0 MB (zero re-compression, zero blur)
        if (file.type === 'image/svg+xml' || file.size <= 3.0 * 1024 * 1024) {
          resolve(rawDataUrl);
          return;
        }
        const img = new window.Image();
        img.onerror = () => resolve(rawDataUrl);
        img.onload = () => {
          try {
            const maxDim = 2200;
            let width = img.naturalWidth || img.width || 1920;
            let height = img.naturalHeight || img.height || 1080;
            if (width > maxDim || height > maxDim) {
              if (width >= height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
              resolve(rawDataUrl);
              return;
            }
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            const isTransparentCapable =
              file.type === 'image/png' || file.type === 'image/webp';
            if (!isTransparentCapable) {
              ctx.fillStyle = '#FFFFFF';
              ctx.fillRect(0, 0, width, height);
            }
            ctx.drawImage(img, 0, 0, width, height);
            const outMime = isTransparentCapable ? 'image/webp' : 'image/jpeg';
            const compressed = canvas.toDataURL(outMime, 0.92);
            resolve(compressed || rawDataUrl);
          } catch {
            resolve(rawDataUrl);
          }
        };
        img.src = rawDataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Prevent 100KB+ base64 Data URLs from flooding text inputs in Admin
  const formatImageInputValue = (url?: string): string => {
    if (!url) return '';
    return url.startsWith('data:image/') ? '' : url;
  };

  const getImageInputPlaceholder = (url?: string, fallback = 'Paste image URL or click Upload'): string => {
    if (url && url.startsWith('data:image/')) {
      return '✓ Custom Uploaded Image Active (Paste URL to override)';
    }
    return fallback;
  };

  // Upload an image to PostgreSQL storage (so all browsers & users see it) and immediately assign & publish it
  const handleHomeImageUpload = (
    bucketId: string,
    fieldKey: string,
    altText: string,
    onUrlReady: (url: string) => void
  ) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (ev) => {
      const file = (ev.target as HTMLInputElement).files?.[0];
      if (!file) return;
      setUploadingFieldKey(fieldKey);
      try {
        const optimizedDataUrl = await optimizeImageFileToDataUrl(file);
        const uniqueFileName = `${fieldKey.replace(/[^a-zA-Z0-9_-]/g, '-')}-${Date.now()}-${file.name}`;

        // 1. Upload to PostgreSQL storage first so we store a lightweight /api/storage/... URL that works across ALL browsers & devices
        const uploaded = await uploadImageToPgStorage({
          bucket_id: bucketId,
          file_name: uniqueFileName,
          mime_type: file.type || 'image/jpeg',
          base64_data: optimizedDataUrl,
          alt_text: altText || file.name,
        });

        const finalUrl = uploaded?.public_url || optimizedDataUrl;
        onUrlReady(finalUrl);
        setPendingUploadAutoSave(true);

        if (uploaded?.public_url) {
          fetchStorageObjectsFromPg().then((objs) => {
            if (objs) setStorageObjects(objs);
          });
          showToast(`Image "${file.name}" uploaded to server and published live for all users!`);
        } else {
          showToast(`Image "${file.name}" updated! (Connect DATABASE_URL on host to sync across all browsers)`);
        }
      } catch {
        showToast('Could not read the selected image file.');
      } finally {
        setUploadingFieldKey(null);
      }
    };
    input.click();
  };

  const handleSaveCompleteHomePage = async () => {
    const ok = await saveHomePageData(draftHome);
    await syncAllFromPostgres();
    if (ok) {
      showToast('Complete Home Page saved successfully!');
    } else {
      showToast('Home Page updated locally.');
    }
  };

  const handleResetCompleteHomePage = async () => {
    const ok = await resetHomePageData();
    await syncAllFromPostgres();
    if (ok) {
      showToast('Home Page reset to default content.');
    }
  };

  const handleSaveCompleteMattresses = async () => {
    const ok = await saveMattressesData(draftMattresses);
    const activeModel = draftMattresses.mattressModels[selectedModelIdx];
    if (activeModel) {
      await createProductInPg({
        id: activeModel.id,
        slug: activeModel.slug,
        name: activeModel.name,
        tagline: activeModel.tagline,
        categories: activeModel.categories,
        top_finish_style: activeModel.topFinishStyle,
        warranty_months: activeModel.warrantyMonths,
        starting_price: activeModel.startingPrice,
        thickness_options: activeModel.thicknessOptions,
        hero_image: activeModel.images.hero,
        cooling_image: activeModel.images.coolingHero || null,
        features: activeModel.features,
      });
    }
    await syncAllFromPostgres();
    const wasNew = isCreatingNewMattress;
    setIsCreatingNewMattress(false);
    if (ok) {
      showToast(
        wasNew && activeModel
          ? `New product "${activeModel.name}" created and published!`
          : 'Complete Mattresses & Mega-Menu Dropdown saved!'
      );
    } else {
      showToast('Mattresses updated locally.');
    }
  };

  const handleResetCompleteMattresses = async () => {
    const ok = await resetMattressesData();
    setSelectedModelIdx(0);
    setIsCreatingNewMattress(false);
    await syncAllFromPostgres();
    if (ok) {
      showToast('Mattresses & Mega-Menu Dropdown reset to defaults.');
    }
  };

  const handleAddNewMattressModel = (defaultCategory?: CatalogueCategoryId) => {
    const base = draftMattresses.mattressModels[0];
    if (!base) return;
    const newIndex = draftMattresses.mattressModels.length + 1;
    const slug = `custom-mattress-${Date.now().toString().slice(-4)}-${newIndex}`;
    const assignedCategories: CatalogueCategoryId[] = defaultCategory
      ? [defaultCategory]
      : ['foam', 'spring', 'orthopedic', 'latex', 'cooling'];
    const baseStart = base.startingPrice || 17640;
    const defaultNewStart = 25998;
    const ratio = defaultNewStart / baseStart;
    const newModel: CatalogueMattressProduct = {
      ...base,
      id: slug,
      slug,
      pageNumber: newIndex,
      name: `New Mindfree Mattress ${newIndex}`,
      tagline: 'Custom Handcrafted Sleep System',
      shortDescription:
        'Multi-layer orthopedic and comfort sleep system tailored for Indian homes.',
      categories: assignedCategories,
      topFinishStyle: 'Euro / Box Top',
      warrantyMonths: 60,
      warrantyYears: 5,
      thicknessOptions: [5, 6, 8, 10],
      startingPrice: defaultNewStart,
      maxPrice: 57998,
      images: {
        ...base.images,
        hero: '/images/products/product-deluxe.jpg',
        coolingHero: '/images/products/product-deluxe.jpg',
      },
      features: [...base.features],
      layers: base.layers.map((l) => ({ ...l })),
      priceMatrix: base.priceMatrix.map((v) => ({
        ...v,
        mrp: Math.round(v.mrp * ratio),
      })),
    };
    const nextModels = [newModel, ...draftMattresses.mattressModels];
    const nextDraft = { ...draftMattresses, mattressModels: nextModels };
    setDraftMattresses(nextDraft);
    saveMattressesData(nextDraft);
    setSelectedModelIdx(0);
    setIsCreatingNewMattress(true);
    setMatDetailStep('basic');
    setMatSubTab('models');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Created "${newModel.name}". Customize details and click Save to update!`);
  };

  const handleCancelNewMattressDraft = () => {
    if (isCreatingNewMattress && draftMattresses.mattressModels.length > 1) {
      const nextModels = draftMattresses.mattressModels.filter(
        (_, i) => i !== selectedModelIdx
      );
      const nextDraft = { ...draftMattresses, mattressModels: nextModels };
      setDraftMattresses(nextDraft);
      saveMattressesData(nextDraft);
      setSelectedModelIdx(0);
    }
    setIsCreatingNewMattress(false);
    setMatSubTab('quick-grid');
  };

  const handleSaveCompletePillows = async () => {
    const ok = await savePillowsData(draftPillows);
    await syncAllFromPostgres();
    const wasNew = isCreatingNewPillow;
    setIsCreatingNewPillow(false);
    if (ok) {
      showToast(
        wasNew
          ? 'New Pillow Product created and published!'
          : 'Complete Pillows Page & Navbar Dropdown saved!'
      );
    } else {
      showToast('Pillows updated locally.');
    }
  };

  const handleResetCompletePillows = async () => {
    const ok = await resetPillowsData();
    setSelectedPillowIdx(0);
    setIsCreatingNewPillow(false);
    await syncAllFromPostgres();
    if (ok) {
      showToast('Pillows Page & Dropdown reset to defaults.');
    }
  };

  const handleAddNewPillowModel = () => {
    const base = draftPillows.pillowModels[0];
    const newIndex = draftPillows.pillowModels.length + 1;
    const sku = `MF-PIL-CUSTOM-${newIndex}`;
    const newPillow: AccessoryItem = {
      id: `pillow-custom-${newIndex}`,
      sku,
      name: `New Ergonomic Pillow ${newIndex}`,
      category: 'pillow',
      tagline: 'Custom Orthopedic Neck & Cervical Support Pillow',
      badge: 'New Release',
      price: 3998,
      originalPrice: 5998,
      rating: 4.9,
      reviewsCount: 120,
      dimensions: '24" × 16" × 5"',
      material: 'High-Density Memory Foam + Bamboo Knit Cover',
      firmnessOrLoft: 'Medium-Plush Adaptive Loft',
      image: base?.image || '/images/pillows/pillow-cervical.jpg',
      sizes: [
        {
          id: 'std',
          label: 'Standard (24" × 16")',
          price: 3998,
          sku: `${sku}-STD`,
        },
        {
          id: 'king',
          label: 'King Contour (28" × 18")',
          price: 4998,
          sku: `${sku}-KNG`,
        },
      ],
      keyFeatures: [
        'Ergonomic cervical wave contour for side & back sleepers',
        'Removable, washable 320 GSM breathable bamboo cover',
        '100% sag-proof high-resilience core with 3-Year Warranty',
      ],
      careInstructions: [
        'Unzip outer cover and machine wash cold on gentle cycle.',
        'Do not submerge or machine wash inner foam core.',
      ],
    };
    const nextModels = [newPillow, ...draftPillows.pillowModels];
    const nextDraft = { ...draftPillows, pillowModels: nextModels };
    setDraftPillows(nextDraft);
    savePillowsData(nextDraft);
    setSelectedPillowIdx(0);
    setIsCreatingNewPillow(true);
    setPilSubTab('models');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Created "${newPillow.name}". Customize details and click Save to update!`);
  };

  const handleCancelNewPillowDraft = () => {
    if (isCreatingNewPillow && draftPillows.pillowModels.length > 1) {
      const next = draftPillows.pillowModels.filter((_, i) => i !== selectedPillowIdx);
      const nextDraft = { ...draftPillows, pillowModels: next };
      setDraftPillows(nextDraft);
      savePillowsData(nextDraft);
      setSelectedPillowIdx(0);
    }
    setIsCreatingNewPillow(false);
    setPilSubTab('quick-grid');
  };

  const handleSaveCompleteFooter = async () => {
    const ok = await saveFooterData(draftFooter);
    await syncAllFromPostgres();
    if (ok) {
      showToast('Complete Footer configuration saved and published!');
    } else {
      showToast('Footer updated locally.');
    }
  };

  const handleResetCompleteFooter = async () => {
    const ok = await resetFooterData();
    await syncAllFromPostgres();
    if (ok) {
      showToast('Footer reset to default configuration.');
    }
  };

  // Auto-save any modified drafts so edits ALWAYS display on the front end immediately
  const commitModifiedDrafts = useCallback(async () => {
    const promises: Promise<unknown>[] = [];
    if (JSON.stringify(draftHome) !== JSON.stringify(homePageData)) {
      promises.push(saveHomePageData(draftHome));
    }
    if (JSON.stringify(draftMattresses) !== JSON.stringify(mattressesData)) {
      promises.push(saveMattressesData(draftMattresses));
    }
    if (JSON.stringify(draftPillows) !== JSON.stringify(pillowsData)) {
      promises.push(savePillowsData(draftPillows));
    }
    if (JSON.stringify(draftWhyMindfree) !== JSON.stringify(whyMindfreeData)) {
      promises.push(saveWhyMindfreeData(draftWhyMindfree));
    }
    if (JSON.stringify(draftFooter) !== JSON.stringify(footerData)) {
      promises.push(saveFooterData(draftFooter));
    }
    if (JSON.stringify(draftContact) !== JSON.stringify(contactData)) {
      promises.push(saveContactData(draftContact));
    }
    if (promises.length > 0) {
      await Promise.all(promises);
      return true;
    }
    return false;
  }, [
    draftHome,
    homePageData,
    saveHomePageData,
    draftMattresses,
    mattressesData,
    saveMattressesData,
    draftPillows,
    pillowsData,
    savePillowsData,
    draftWhyMindfree,
    whyMindfreeData,
    saveWhyMindfreeData,
    draftFooter,
    footerData,
    saveFooterData,
    draftContact,
    contactData,
    saveContactData,
  ]);

  const handlePublishAllStorefrontPages = async () => {
    await Promise.all([
      saveHomePageData(draftHome),
      saveMattressesData(draftMattresses),
      savePillowsData(draftPillows),
      saveWhyMindfreeData(draftWhyMindfree),
      saveFooterData(draftFooter),
      saveContactData(draftContact),
    ]);
    await syncAllFromPostgres();
    showToast('All 6 Storefront Pages (Home, Mattresses, Pillows, Why Mindfree, Footer & Contact) saved and published live!');
  };

  const handleGoToStorefront = async () => {
    await commitModifiedDrafts();
    navigateToHome();
  };

  const handleSwitchAdminTab = async (nextTab: AdminTab) => {
    await commitModifiedDrafts();
    setActiveTab(nextTab);
  };

  // Immediately persist any draft changes right after an image upload completes
  useEffect(() => {
    if (!pendingUploadAutoSave) return;
    setPendingUploadAutoSave(false);
    commitModifiedDrafts();
  }, [pendingUploadAutoSave, commitModifiedDrafts]);

  // Automatically sync any Admin edits after a 400ms debounce so all added/edited products immediately reflect on the storefront
  useEffect(() => {
    const timer = window.setTimeout(() => {
      commitModifiedDrafts();
    }, 400);
    return () => window.clearTimeout(timer);
  }, [commitModifiedDrafts]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((acc, o) => acc + o.total, 0);
    const confirmed = orders.filter((o) => o.orderStatus === 'Confirmed').length;
    const preparing = orders.filter((o) => o.orderStatus === 'Preparing in Atelier').length;
    const dispatched = orders.filter((o) => o.orderStatus === 'Dispatched').length;
    const delivered = orders.filter((o) => o.orderStatus === 'Delivered').length;

    return {
      totalOrders,
      totalRevenue,
      confirmed,
      preparing,
      dispatched,
      delivered,
    };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesStatus = statusFilter === 'All' || order.orderStatus === statusFilter;
      const cleanSearch = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !cleanSearch ||
        order.orderId.toLowerCase().includes(cleanSearch) ||
        order.customer.fullName.toLowerCase().includes(cleanSearch) ||
        order.customer.city.toLowerCase().includes(cleanSearch) ||
        order.customer.phone.includes(cleanSearch) ||
        order.items.some((i) => i.name.toLowerCase().includes(cleanSearch));

      return matchesStatus && matchesSearch;
    });
  }, [orders, statusFilter, searchTerm]);

  const filteredStorageObjects = useMemo(() => {
    return storageObjects.filter((obj) => !selectedBucketId || obj.bucket_id === selectedBucketId);
  }, [storageObjects, selectedBucketId]);

  const getStatusBadgeStyle = (status: OrderStatusType) => {
    switch (status) {
      case 'Confirmed':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'Preparing in Atelier':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Dispatched':
        return 'bg-purple-50 text-purple-800 border-purple-200';
      case 'Delivered':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  if (!isAdminAuthenticated) {
    return (
      <div className="min-h-screen w-full bg-[#F8FAFC] flex flex-col justify-center items-center px-4 py-12 font-sans text-[#071F52]">
        <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_20px_50px_rgba(10,46,115,0.12)] overflow-hidden">
          {/* Top Royal Navy Header */}
          <div className="bg-[#0A2E73] px-6 py-7 text-center text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-radial from-[#1244A8] via-[#0A2E73] to-[#071F52] opacity-90 pointer-events-none" />
            <div className="relative space-y-3">
              <div className="inline-flex items-center justify-center bg-white px-4 py-2 rounded-2xl shadow-sm mx-auto">
                <img
                  src="/images/mindfree_logo_transparent.png?v=2"
                  alt="MIND FREE MATTRESS"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/15 border border-white/20 text-[10px] font-semibold uppercase tracking-widest text-white">
                  <ShieldCheck className="w-3.5 h-3.5 text-white" />
                  <span>Protected Atelier Portal</span>
                </div>
                <h1 className="text-xl sm:text-2xl font-serif font-bold text-white">
                  Admin &amp; CMS Login
                </h1>
                <p className="text-xs text-white/80">
                  Sign in with your administrator credentials to manage products, orders, and site content.
                </p>
              </div>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleAdminLoginSubmit} className="p-6 sm:p-8 space-y-5 text-xs">
            {adminLoginError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 font-semibold flex items-start gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{adminLoginError}</span>
              </div>
            )}

            <div>
              <label className="block font-bold text-[#071F52] uppercase tracking-wider text-[11px] mb-1.5">
                Admin User ID / Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="mindfreematress@gmail.com"
                  value={adminLoginUserId}
                  onChange={(e) => {
                    setAdminLoginUserId(e.target.value);
                    if (adminLoginError) setAdminLoginError(null);
                  }}
                  className="w-full min-h-[44px] pl-10 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-medium text-[#071F52] focus:bg-white focus:border-[#0A2E73] outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#071F52] uppercase tracking-wider text-[11px] mb-1.5">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#64748B] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  value={adminLoginPassword}
                  onChange={(e) => {
                    setAdminLoginPassword(e.target.value);
                    if (adminLoginError) setAdminLoginError(null);
                  }}
                  className="w-full min-h-[44px] pl-10 pr-11 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-sm font-medium text-[#071F52] focus:bg-white focus:border-[#0A2E73] outline-none transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#64748B] hover:text-[#0A2E73] cursor-pointer"
                  aria-label={showAdminPassword ? 'Hide password' : 'Show password'}
                >
                  {showAdminPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full min-h-[46px] py-3 px-5 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Sign In to Admin Center</span>
            </button>

            <div className="pt-3 border-t border-[#E2E8F0] flex items-center justify-center">
              <button
                type="button"
                onClick={navigateToHome}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#0A2E73] cursor-pointer transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Storefront</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#F8FAFC] min-h-screen font-sans text-[#071F52] select-none flex flex-col lg:flex-row items-stretch">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#071F52] text-[#F8FAFC] px-4 py-3 rounded-2xl shadow-xl border border-[#E3262E]/40 flex items-center gap-2 text-xs">
          <Sparkles className="w-4 h-4 text-[#E3262E]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* LEFT SIDEBAR: BRAND LOGO, VERTICAL TABS & ACTIONS                 */}
      {/* ================================================================= */}
      <aside className="w-full lg:w-[290px] xl:w-[310px] shrink-0 bg-white border-b lg:border-b-0 lg:border-r border-[#E2E8F0] lg:sticky lg:top-0 lg:h-screen p-4 sm:p-5 flex flex-col justify-between gap-4 z-30 shadow-xs lg:overflow-hidden">
        {/* Top Brand Logo + Admin Title */}
        <div className="shrink-0 space-y-2.5 pb-3.5 border-b border-[#E2E8F0]">
          <div className="flex items-center justify-between gap-3">
            <img
              src="/images/mindfree_logo_transparent.png?v=2"
              alt="MIND FREE MATTRESS"
              onClick={handleGoToStorefront}
              className="h-10 w-auto object-contain shrink-0 cursor-pointer"
              title="Save & Return to Storefront"
            />
            {pgHealth?.ok && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                ONLINE
              </span>
            )}
          </div>

          <div>
            <div className="text-[10px] font-mono text-[#E3262E] uppercase tracking-wider font-bold">
              Mindfree Sleep Systems
            </div>
            <h1 className="text-base sm:text-lg font-serif font-bold text-[#071F52] mt-0.5 leading-snug">
              Atelier Admin &amp; CMS Center
            </h1>
            <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">
              Complete management for orders, mattresses, pillows, and site content.
            </p>
          </div>
        </div>

        {/* Middle Scrollable Navigation Menu Tabs */}
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="shrink-0 text-[10px] font-bold uppercase tracking-widest text-[#94A3B8] px-2 mb-2">
            Admin Workspace Sections
          </div>
          <div className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar pb-1 lg:pb-0 lg:pr-1">
            {[
              { id: 'homepage' as const, label: 'Home Page', icon: Home },
              {
                id: 'products' as const,
                label: `Mattresses & Dropdown (${draftMattresses.mattressModels.length} Models)`,
                icon: Layers,
              },
              {
                id: 'pillows' as const,
                label: `Pillows & Dropdown (${draftPillows.pillowModels.length} Pillows)`,
                icon: Sparkles,
              },
              {
                id: 'why-mindfree' as const,
                label: 'Why Mindfree & Dropdown',
                icon: Sparkles,
              },
              {
                id: 'footer' as const,
                label: 'Footer',
                icon: FileText,
              },
              {
                id: 'contact' as const,
                label: 'Contact Us',
                icon: Phone,
              },
              { id: 'orders' as const, label: `Orders (${orders.length})`, icon: Package },
              {
                id: 'content' as const,
                label: 'Site Content & Diagnostics',
                icon: Database,
              },
            ].map((t) => {
              const Icon = t.icon;
              const active = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleSwitchAdminTab(t.id)}
                  className={`w-auto lg:w-full min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-2.5 whitespace-nowrap lg:whitespace-normal text-left cursor-pointer transition-all shrink-0 ${
                    active
                      ? 'bg-[#0A2E73] text-white shadow-[0_6px_16px_rgba(10,46,115,0.2)]'
                      : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73] hover:bg-white'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="leading-snug">{t.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom Sidebar Actions: Sync, Logout & Back to Store */}
        <div className="shrink-0 pt-3 border-t border-[#E2E8F0] space-y-2">
          <div className="px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#64748B] font-bold">
                Signed In Admin
              </div>
              <div className="text-[11px] font-bold text-[#071F52] truncate">
                mindfreematress@gmail.com
              </div>
            </div>
            <button
              type="button"
              onClick={handleAdminLogout}
              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 text-[10px] font-bold inline-flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              title="Logout Admin"
            >
              <LogOut className="w-3 h-3" />
              <span>Logout</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={refreshOrders}
              className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs font-semibold text-[#0A2E73] hover:bg-white hover:border-[#0A2E73] active:scale-95 cursor-pointer shadow-2xs transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#E3262E] shrink-0 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>Sync Data</span>
            </button>

            <button
              type="button"
              onClick={handleGoToStorefront}
              className="w-full min-h-[40px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] active:scale-95 text-[#F8FAFC] text-xs font-semibold cursor-pointer shadow-md transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Storefront</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* RIGHT MAIN CONTENT WORKSPACE                                      */}
      {/* ================================================================= */}
      <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 space-y-6 overflow-x-hidden">

        {/* =============================================================== */}
        {/* TAB 0: COMPLETE HOME PAGE EDITOR                                */}
        {/* =============================================================== */}
        {activeTab === 'homepage' && (
          <div className="space-y-6">
            {/* Top Action Bar for Home Page CMS */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-[#E3262E] shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-[#071F52]">
                    Home Page Complete Visual Editor
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Edit every section of the Home Page — Hero Banner Slides, Feature Strip, Shop By Room, Catalogue Header, Quiz Banner &amp; Google Reviews Summary.
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResetCompleteHomePage}
                  disabled={isSavingHomePage}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-rose-50 text-[#475569] hover:text-rose-700 border border-[#E2E8F0] text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCompleteHomePage}
                  disabled={isSavingHomePage}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E3262E] hover:bg-[#C8161D] active:scale-98 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-[0_8px_20px_rgba(227,38,46,0.28)] transition-all"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>
                    {isSavingHomePage ? 'Saving Home Page...' : 'Save Home Page'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sub-Section Switcher Pills inside Home Page Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {[
                { id: 'hero' as const, label: '1. Hero Banner Slides (4) & Feature Strip (3)' },
                { id: 'rooms' as const, label: '2. Shop By Room Section (4 Rooms & Product Cards)' },
                { id: 'catalogue-quiz' as const, label: '3. Catalogue Header & Quiz Banner (4 PNG Beds)' },
                { id: 'reviews' as const, label: '4. Google Reviews Summary Card' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setHomeSubTab(sub.id)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all ${
                    homeSubTab === sub.id
                      ? 'bg-[#071F52] text-white shadow-xs'
                      : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 1: HERO BANNER SLIDES & FEATURE STRIP               */}
            {/* ----------------------------------------------------------- */}
            {homeSubTab === 'hero' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {draftHome.heroSlides.map((slide, idx) => {
                    const uploadKey = `hero-slide-${idx}`;
                    return (
                      <div
                        key={slide.id}
                        className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4 text-xs"
                      >
                        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                          <div>
                            <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                              Hero Banner Slide {idx + 1}
                            </span>
                            <h3 className="text-base font-bold text-[#071F52]">
                              {slide.headlineTop} — {slide.headlineHighlight}
                            </h3>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[10px] text-[#64748B]">
                            ID: {slide.id}
                          </span>
                        </div>

                        {/* Live Banner Image Preview + Upload */}
                        <div className="relative h-48 sm:h-52 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#EAF3FC] flex items-center justify-center p-1.5">
                          <img
                            src={slide.imageJpg}
                            alt={slide.altText}
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                          />
                          {slide.imageJpg?.startsWith('data:image/') && (
                            <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full bg-emerald-600/95 text-white text-[10px] font-bold shadow-xs">
                              ✓ Uploaded Image Active
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              handleHomeImageUpload(
                                'hero-banners',
                                uploadKey,
                                `${slide.headlineTop} ${slide.headlineHighlight}`,
                                (url) => {
                                  const nextSlides = [...draftHome.heroSlides];
                                  nextSlides[idx] = {
                                    ...nextSlides[idx],
                                    imageJpg: url,
                                    imageWebp: '',
                                    thumbnailWebp: '',
                                  };
                                  setDraftHome({ ...draftHome, heroSlides: nextSlides });
                                }
                              )
                            }
                            className="absolute bottom-2.5 right-2.5 px-3.5 py-2 rounded-xl bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white font-semibold flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                          >
                            <Upload className="w-3.5 h-3.5" />
                            <span>
                              {uploadingFieldKey === uploadKey
                                ? 'Uploading...'
                                : 'Upload Banner Image'}
                            </span>
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Headline Line 1 (Navy)
                            </label>
                            <input
                              type="text"
                              value={slide.headlineTop}
                              onChange={(e) => {
                                const nextSlides = [...draftHome.heroSlides];
                                nextSlides[idx] = { ...nextSlides[idx], headlineTop: e.target.value };
                                setDraftHome({ ...draftHome, heroSlides: nextSlides });
                              }}
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:border-[#0A2E73] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Headline Line 2 (Red Highlight)
                            </label>
                            <input
                              type="text"
                              value={slide.headlineHighlight}
                              onChange={(e) => {
                                const nextSlides = [...draftHome.heroSlides];
                                nextSlides[idx] = {
                                  ...nextSlides[idx],
                                  headlineHighlight: e.target.value,
                                };
                                setDraftHome({ ...draftHome, heroSlides: nextSlides });
                              }}
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:border-[#0A2E73] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#0F2952] mb-1">
                            Supporting Description Text
                          </label>
                          <textarea
                            rows={2}
                            value={slide.supportingText}
                            onChange={(e) => {
                              const nextSlides = [...draftHome.heroSlides];
                              nextSlides[idx] = {
                                ...nextSlides[idx],
                                supportingText: e.target.value,
                              };
                              setDraftHome({ ...draftHome, heroSlides: nextSlides });
                            }}
                            className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] focus:bg-white focus:border-[#0A2E73] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Button Text
                            </label>
                            <input
                              type="text"
                              value={slide.primaryCtaText}
                              onChange={(e) => {
                                const nextSlides = [...draftHome.heroSlides];
                                nextSlides[idx] = {
                                  ...nextSlides[idx],
                                  primaryCtaText: e.target.value,
                                };
                                setDraftHome({ ...draftHome, heroSlides: nextSlides });
                              }}
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>

                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Button Style
                            </label>
                            <select
                              value={slide.buttonVariant || 'solid-red'}
                              onChange={(e) => {
                                const nextSlides = [...draftHome.heroSlides];
                                nextSlides[idx] = {
                                  ...nextSlides[idx],
                                  buttonVariant: e.target.value as 'solid-red' | 'outline-red',
                                };
                                setDraftHome({ ...draftHome, heroSlides: nextSlides });
                              }}
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            >
                              <option value="solid-red">Solid Red Pill</option>
                              <option value="outline-red">White with Red Border</option>
                            </select>
                          </div>

                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Banner Image URL
                            </label>
                            <input
                              type="text"
                              value={formatImageInputValue(slide.imageJpg)}
                              placeholder={getImageInputPlaceholder(slide.imageJpg, '/images/hero-banner-1.jpg')}
                              onChange={(e) => {
                                const nextSlides = [...draftHome.heroSlides];
                                nextSlides[idx] = {
                                  ...nextSlides[idx],
                                  imageJpg: e.target.value,
                                  imageWebp: e.target.value,
                                  thumbnailWebp: e.target.value,
                                };
                                setDraftHome({ ...draftHome, heroSlides: nextSlides });
                              }}
                              className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Bottom 3-Item Feature Strip Editor */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 text-xs">
                  <h3 className="text-base font-bold text-[#071F52]">
                    Hero Bottom Feature Strip (3 Value Highlights)
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {draftHome.heroFeatures.map((feat, fIdx) => (
                      <div
                        key={feat.id}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                      >
                        <div className="font-bold text-[#E3262E] uppercase text-[10px] tracking-wider">
                          Feature Strip Item #{fIdx + 1}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Accent Word (Blue)
                            </label>
                            <input
                              type="text"
                              value={feat.titleAccent}
                              onChange={(e) => {
                                const next = [...draftHome.heroFeatures];
                                next[fIdx] = { ...next[fIdx], titleAccent: e.target.value };
                                setDraftHome({ ...draftHome, heroFeatures: next });
                              }}
                              className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Main Title (Navy)
                            </label>
                            <input
                              type="text"
                              value={feat.titleMain}
                              onChange={(e) => {
                                const next = [...draftHome.heroFeatures];
                                next[fIdx] = { ...next[fIdx], titleMain: e.target.value };
                                setDraftHome({ ...draftHome, heroFeatures: next });
                              }}
                              className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block font-semibold text-[#0F2952] mb-1">
                            Subtitle Line
                          </label>
                          <input
                            type="text"
                            value={feat.subtitle}
                            onChange={(e) => {
                              const next = [...draftHome.heroFeatures];
                              next[fIdx] = { ...next[fIdx], subtitle: e.target.value };
                              setDraftHome({ ...draftHome, heroFeatures: next });
                            }}
                            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 2: SHOP BY ROOM SECTION                             */}
            {/* ----------------------------------------------------------- */}
            {homeSubTab === 'rooms' && (
              <div className="space-y-6 text-xs">
                {/* Section Header Editor */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-[#071F52]">
                    Shop By Room — Section Header
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Eyebrow Text
                      </label>
                      <input
                        type="text"
                        value={draftHome.shopByRoom.eyebrow}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            shopByRoom: { ...draftHome.shopByRoom, eyebrow: e.target.value },
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Title Part 1 (Navy)
                      </label>
                      <input
                        type="text"
                        value={draftHome.shopByRoom.titlePart1}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            shopByRoom: { ...draftHome.shopByRoom, titlePart1: e.target.value },
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Title Part 2 (Red)
                      </label>
                      <input
                        type="text"
                        value={draftHome.shopByRoom.titlePart2}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            shopByRoom: { ...draftHome.shopByRoom, titlePart2: e.target.value },
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 4 Room Cards Editor */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {draftHome.shopByRoom.rooms.map((room, rIdx) => {
                    const roomImgKey = `room-scene-${rIdx}`;
                    const prodImgKey = `room-prod-${rIdx}`;
                    const updateRoom = (patch: Partial<typeof room>) => {
                      const nextRooms = [...draftHome.shopByRoom.rooms];
                      nextRooms[rIdx] = { ...nextRooms[rIdx], ...patch };
                      setDraftHome({
                        ...draftHome,
                        shopByRoom: { ...draftHome.shopByRoom, rooms: nextRooms },
                      });
                    };
                    const updateRoomProduct = (patch: Partial<typeof room.product>) => {
                      const nextRooms = [...draftHome.shopByRoom.rooms];
                      nextRooms[rIdx] = {
                        ...nextRooms[rIdx],
                        product: { ...nextRooms[rIdx].product, ...patch },
                      };
                      setDraftHome({
                        ...draftHome,
                        shopByRoom: { ...draftHome.shopByRoom, rooms: nextRooms },
                      });
                    };

                    return (
                      <div
                        key={room.id}
                        className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4"
                      >
                        <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                          <div>
                            <span className="text-[10px] font-mono uppercase text-[#E3262E] font-bold">
                              Room #{rIdx + 1} ({room.id})
                            </span>
                            <h4 className="text-base font-bold text-[#071F52]">{room.name}</h4>
                          </div>
                        </div>

                        {/* Room Scene Photo + Product Card Photo Previews */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <span className="font-semibold text-[#0F2952] block">
                              Room Scene Photo
                            </span>
                            <div className="relative h-40 sm:h-44 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center">
                              <img
                                src={room.roomImage}
                                alt={room.name}
                                className="w-full h-full object-contain p-1.5"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleHomeImageUpload(
                                    'room-showcase',
                                    roomImgKey,
                                    room.name,
                                    (url) => updateRoom({ roomImage: url })
                                  )
                                }
                                className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>
                                  {uploadingFieldKey === roomImgKey ? 'Uploading...' : 'Upload'}
                                </span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={formatImageInputValue(room.roomImage)}
                              placeholder={getImageInputPlaceholder(room.roomImage)}
                              onChange={(e) => updateRoom({ roomImage: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <span className="font-semibold text-[#0F2952] block">
                              Featured Mattress Photo
                            </span>
                            <div className="relative h-40 sm:h-44 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center">
                              <img
                                src={room.product.image}
                                alt={room.product.name}
                                className="w-full h-full object-contain p-1.5"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleHomeImageUpload(
                                    'room-showcase',
                                    prodImgKey,
                                    room.product.name,
                                    (url) => updateRoomProduct({ image: url })
                                  )
                                }
                                className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                              >
                                <ImageIcon className="w-3 h-3" />
                                <span>
                                  {uploadingFieldKey === prodImgKey ? 'Uploading...' : 'Upload'}
                                </span>
                              </button>
                            </div>
                            <input
                              type="text"
                              value={formatImageInputValue(room.product.image)}
                              placeholder={getImageInputPlaceholder(room.product.image)}
                              onChange={(e) => updateRoomProduct({ image: e.target.value })}
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Room Tab Name
                            </label>
                            <input
                              type="text"
                              value={room.name}
                              onChange={(e) => updateRoom({ name: e.target.value })}
                              className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Featured Mattress Name
                            </label>
                            <input
                              type="text"
                              value={room.product.name}
                              onChange={(e) => updateRoomProduct({ name: e.target.value })}
                              className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block font-semibold text-[#0F2952] mb-1">
                            Mattress Short Description
                          </label>
                          <input
                            type="text"
                            value={room.product.description}
                            onChange={(e) => updateRoomProduct({ description: e.target.value })}
                            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Top Badge (e.g. BESTSELLER)
                            </label>
                            <input
                              type="text"
                              value={room.product.badgeLabel}
                              onChange={(e) => updateRoomProduct({ badgeLabel: e.target.value })}
                              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              MRP (Strikethrough)
                            </label>
                            <input
                              type="text"
                              value={room.product.mrpFormatted}
                              onChange={(e) => updateRoomProduct({ mrpFormatted: e.target.value })}
                              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Offer Price
                            </label>
                            <input
                              type="text"
                              value={room.product.priceFormatted}
                              onChange={(e) =>
                                updateRoomProduct({ priceFormatted: e.target.value })
                              }
                              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2.5">
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Discount Label
                            </label>
                            <input
                              type="text"
                              value={room.product.discountLabel}
                              onChange={(e) => updateRoomProduct({ discountLabel: e.target.value })}
                              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Rating (e.g. 4.8/5)
                            </label>
                            <input
                              type="text"
                              value={room.product.rating}
                              onChange={(e) => updateRoomProduct({ rating: e.target.value })}
                              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Reviews Text
                            </label>
                            <input
                              type="text"
                              value={room.product.reviewsCount}
                              onChange={(e) => updateRoomProduct({ reviewsCount: e.target.value })}
                              className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 3: CATALOGUE HEADER & MATTRESS FINDER QUIZ BANNER   */}
            {/* ----------------------------------------------------------- */}
            {homeSubTab === 'catalogue-quiz' && (
              <div className="space-y-6 text-xs">
                {/* Catalogue Header */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-[#071F52]">
                    Mattress Catalogue Section Header
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Catalogue Eyebrow
                      </label>
                      <input
                        type="text"
                        value={draftHome.catalogueHeader.eyebrow}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            catalogueHeader: {
                              ...draftHome.catalogueHeader,
                              eyebrow: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Catalogue Main Heading
                      </label>
                      <input
                        type="text"
                        value={draftHome.catalogueHeader.title}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            catalogueHeader: {
                              ...draftHome.catalogueHeader,
                              title: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[42px] px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Quiz Banner Editor */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
                  <h3 className="text-base font-bold text-[#071F52]">
                    Personalized Mattress Recommendation Quiz Banner
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Eyebrow Text
                      </label>
                      <input
                        type="text"
                        value={draftHome.quizBanner.eyebrow}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            quizBanner: { ...draftHome.quizBanner, eyebrow: e.target.value },
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Headline Line 1
                      </label>
                      <input
                        type="text"
                        value={draftHome.quizBanner.headlineLine1}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            quizBanner: {
                              ...draftHome.quizBanner,
                              headlineLine1: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Headline Line 2
                      </label>
                      <input
                        type="text"
                        value={draftHome.quizBanner.headlineLine2}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            quizBanner: {
                              ...draftHome.quizBanner,
                              headlineLine2: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Subtitle Text
                      </label>
                      <input
                        type="text"
                        value={draftHome.quizBanner.subtitle}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            quizBanner: { ...draftHome.quizBanner, subtitle: e.target.value },
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        CTA Button Label
                      </label>
                      <input
                        type="text"
                        value={draftHome.quizBanner.ctaText}
                        onChange={(e) =>
                          setDraftHome({
                            ...draftHome,
                            quizBanner: { ...draftHome.quizBanner, ctaText: e.target.value },
                          })
                        }
                        className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  {/* 4 Rotating PNG Beds */}
                  <div className="pt-2">
                    <h4 className="font-bold text-[#071F52] mb-3">
                      4 Rotating Transparent PNG Mattress Cutouts
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {draftHome.quizBanner.beds.map((bed, bIdx) => {
                        const bedKey = `quiz-bed-${bIdx}`;
                        return (
                          <div
                            key={bed.id}
                            className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
                          >
                            <div className="relative h-28 rounded-xl bg-gradient-to-r from-[#AE0B12] to-[#E52229] flex items-center justify-center p-2 overflow-hidden">
                              <img
                                src={bed.image}
                                alt={bed.label}
                                className="max-h-24 w-auto object-contain"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  handleHomeImageUpload(
                                    'media-uploads',
                                    bedKey,
                                    bed.label,
                                    (url) => {
                                      const nextBeds = [...draftHome.quizBanner.beds];
                                      nextBeds[bIdx] = { ...nextBeds[bIdx], image: url };
                                      setDraftHome({
                                        ...draftHome,
                                        quizBanner: { ...draftHome.quizBanner, beds: nextBeds },
                                      });
                                    }
                                  )
                                }
                                className="absolute bottom-1.5 right-1.5 px-2.5 py-1 rounded-lg bg-white text-[#0A2E73] text-[10px] font-bold shadow-sm cursor-pointer"
                              >
                                {uploadingFieldKey === bedKey ? '...' : 'Upload PNG'}
                              </button>
                            </div>
                            <input
                              type="text"
                              value={bed.label}
                              onChange={(e) => {
                                const nextBeds = [...draftHome.quizBanner.beds];
                                nextBeds[bIdx] = { ...nextBeds[bIdx], label: e.target.value };
                                setDraftHome({
                                  ...draftHome,
                                  quizBanner: { ...draftHome.quizBanner, beds: nextBeds },
                                });
                              }}
                              placeholder="Bed Label"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white outline-none"
                            />
                            <input
                              type="text"
                              value={bed.image}
                              onChange={(e) => {
                                const nextBeds = [...draftHome.quizBanner.beds];
                                nextBeds[bIdx] = { ...nextBeds[bIdx], image: e.target.value };
                                setDraftHome({
                                  ...draftHome,
                                  quizBanner: { ...draftHome.quizBanner, beds: nextBeds },
                                });
                              }}
                              placeholder="Image URL"
                              className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-[11px] outline-none"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 4: GOOGLE REVIEWS SUMMARY                           */}
            {/* ----------------------------------------------------------- */}
            {homeSubTab === 'reviews' && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 text-xs max-w-2xl">
                <h3 className="text-base font-bold text-[#071F52]">
                  Google Reviews Summary Card (Bottom of Home Page)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Displayed Average Rating (e.g. 4.8)
                    </label>
                    <input
                      type="text"
                      value={draftHome.reviewsSummary.averageRating}
                      onChange={(e) =>
                        setDraftHome({
                          ...draftHome,
                          reviewsSummary: {
                            ...draftHome.reviewsSummary,
                            averageRating: e.target.value,
                          },
                        })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Base Total Review Count (e.g. 946)
                    </label>
                    <input
                      type="number"
                      value={draftHome.reviewsSummary.baseReviewCount}
                      onChange={(e) =>
                        setDraftHome({
                          ...draftHome,
                          reviewsSummary: {
                            ...draftHome.reviewsSummary,
                            baseReviewCount: Number(e.target.value) || 0,
                          },
                        })
                      }
                      className="w-full min-h-[44px] px-3.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 1: ORDERS & DISPATCH                                        */}
        {/* =============================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            {/* Executive Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Total Orders</span>
                  <Package className="w-4 h-4 text-[#E3262E]" />
                </div>
                <div className="text-2xl font-serif font-bold text-[#071F52]">
                  {metrics.totalOrders}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">All recorded orders</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Atelier Revenue</span>
                  <span className="text-xs font-bold text-[#E3262E]">INR</span>
                </div>
                <div className="text-2xl font-serif font-bold text-[#0A2E73]">
                  ₹{metrics.totalRevenue.toLocaleString('en-IN')}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">Verified gross value</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between text-amber-700 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">In Atelier</span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="text-2xl font-serif font-bold text-[#071F52]">
                  {metrics.preparing + metrics.confirmed}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">Crafting & QC stages</div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between text-purple-700 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Dispatched</span>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="text-2xl font-serif font-bold text-[#071F52]">
                  {metrics.dispatched}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">White-glove transit</div>
              </div>

              <div className="col-span-2 lg:col-span-1 bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs">
                <div className="flex items-center justify-between text-emerald-700 mb-2">
                  <span className="text-xs font-medium uppercase tracking-wider">Delivered</span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-2xl font-serif font-bold text-[#071F52]">
                  {metrics.delivered}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-1">100-night trial active</div>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  placeholder="Search by Order ID, customer, city, phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full min-h-[48px] pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0A2E73] focus:bg-white outline-none"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {(['All', 'Confirmed', 'Preparing in Atelier', 'Dispatched', 'Delivered'] as const).map(
                  (tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setStatusFilter(tab)}
                      className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                        statusFilter === tab
                          ? 'bg-[#0A2E73] text-[#F8FAFC] font-bold shadow-xs'
                          : 'bg-[#F8FAFC] hover:bg-[#DBEAFE] text-[#55645D]'
                      }`}
                    >
                      {tab}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#64748B] uppercase text-[10px] tracking-wider">
                      <th className="py-4 px-5 font-semibold">Order ID & Date</th>
                      <th className="py-4 px-5 font-semibold">Customer & Destination</th>
                      <th className="py-4 px-5 font-semibold">Mattress Specifications</th>
                      <th className="py-4 px-5 font-semibold">Total & Payment</th>
                      <th className="py-4 px-5 font-semibold">Fulfillment Status</th>
                      <th className="py-4 px-5 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E2E8F0]">
                    {filteredOrders.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-[#94A3B8]">
                          No orders found matching the filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredOrders.map((order) => (
                        <tr key={order.orderId} className="hover:bg-[#F8FAFC]/60 transition-colors">
                          <td className="py-4 px-5 align-top">
                            <div className="font-mono font-bold text-xs text-[#0A2E73]">
                              {order.orderId}
                            </div>
                            <div className="text-[11px] text-[#94A3B8] mt-0.5">
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                            <div className="text-[10px] text-[#E3262E] font-mono mt-0.5">
                              {order.trackingNumber}
                            </div>
                          </td>

                          <td className="py-4 px-5 align-top">
                            <div className="font-semibold text-xs text-[#071F52]">
                              {order.customer.fullName}
                            </div>
                            <div className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#E3262E]" />
                              <span>
                                {order.customer.city}, {order.customer.pincode}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#94A3B8] mt-0.5">
                              +91 {order.customer.phone}
                            </div>
                          </td>

                          <td className="py-4 px-5 align-top">
                            <div className="space-y-1 max-w-xs">
                              {order.items.map((i) => (
                                <div key={i.sku} className="text-[11px] text-[#071F52] flex items-center justify-between gap-2">
                                  <span className="truncate font-medium">{i.name}</span>
                                  <span className="font-mono text-[10px] text-[#94A3B8] shrink-0">
                                    {i.size.split(' ')[0]} • Qty {i.quantity}
                                  </span>
                                </div>
                              ))}
                            </div>
                            <div className="text-[10px] text-emerald-800 mt-1 font-medium">
                              Est: {order.estimatedDelivery}
                            </div>
                          </td>

                          <td className="py-4 px-5 align-top">
                            <div className="font-serif font-bold text-xs text-[#0A2E73]">
                              ₹{order.total.toLocaleString('en-IN')}
                            </div>
                            <div className="text-[10px] uppercase font-mono tracking-wider text-[#64748B] mt-0.5">
                              {order.paymentMethod}
                            </div>
                            <span
                              className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full mt-1 ${
                                order.paymentStatus === 'Paid'
                                  ? 'bg-emerald-50 text-emerald-800'
                                  : 'bg-amber-50 text-amber-800'
                              }`}
                            >
                              {order.paymentStatus}
                            </span>
                          </td>

                          <td className="py-4 px-5 align-top">
                            <div className="relative inline-block">
                              <select
                                value={order.orderStatus}
                                onChange={(e) =>
                                  handleStatusChange(order.orderId, e.target.value as OrderStatusType)
                                }
                                className={`text-xs font-semibold px-3 py-1.5 rounded-xl border appearance-none pr-8 cursor-pointer outline-none transition-all ${getStatusBadgeStyle(
                                  order.orderStatus
                                )}`}
                              >
                                <option value="Confirmed">Confirmed</option>
                                <option value="Preparing in Atelier">Preparing in Atelier</option>
                                <option value="Dispatched">Dispatched</option>
                                <option value="Delivered">Delivered</option>
                              </select>
                              <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                            </div>
                          </td>

                          <td className="py-4 px-5 align-top text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-xs font-semibold text-white transition-colors cursor-pointer shadow-2xs"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Update Tracking</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2: COMPLETE MATTRESSES & MEGA-MENU DROPDOWN EDITOR          */}
        {/* =============================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Top Action Bar for Mattresses & Mega-Menu Dropdown CMS */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Layers className="w-5 h-5 text-[#E3262E] shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-[#071F52]">
                    Mattresses &amp; Mega-Menu Dropdown Complete Visual Editor
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Edit all {draftMattresses.mattressModels.length} Mattress Models (names, prices, 17-size price matrix, thicknesses, warranties, images, internal layers &amp; features), the 5-column Navbar &ldquo;Mattresses&rdquo; Mega-Menu Dropdown, and Category Tabs.
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleAddNewMattressModel()}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all shadow-xs"
                >
                  <Plus className="w-4 h-4 shrink-0" />
                  <span>Add New Product</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetCompleteMattresses}
                  disabled={isSavingMattresses}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-rose-50 text-[#475569] hover:text-rose-700 border border-[#E2E8F0] text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCompleteMattresses}
                  disabled={isSavingMattresses}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E3262E] hover:bg-[#C8161D] active:scale-98 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-[0_8px_20px_rgba(227,38,46,0.28)] transition-all"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>
                    {isSavingMattresses
                      ? 'Saving Mattresses...'
                      : 'Save Mattresses & Dropdown'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sub-Tab Switcher inside Mattresses & Dropdown Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'quick-grid' as const,
                  label: '1. Category-Wise Mattresses (5 Categories)',
                },
                {
                  id: 'models' as const,
                  label: '2. Full Mattress Editor (Specs, Layers & 17-Size Prices)',
                },
                {
                  id: 'megamenu' as const,
                  label: '3. Navbar "Mattresses" Dropdown (5 Columns)',
                },
                {
                  id: 'categories' as const,
                  label: '4. Category Filter Tabs (6 Tabs)',
                },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setMatSubTab(sub.id)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all ${
                    matSubTab === sub.id
                      ? 'bg-[#071F52] text-white shadow-xs'
                      : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 0: CATEGORY-WISE MATTRESSES VIEW                    */}
            {/* ----------------------------------------------------------- */}
            {matSubTab === 'quick-grid' && (
              <div className="space-y-6 text-xs">
                {/* Search + Category Filter Bar */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
                  <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                    <input
                      type="text"
                      value={matSearchQuery}
                      onChange={(e) => setMatSearchQuery(e.target.value)}
                      placeholder="Search mattress by name or tagline..."
                      className="w-full min-h-[44px] pl-10 pr-4 py-2 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] focus:border-[#0A2E73] focus:bg-white outline-none text-xs"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {(
                      [
                        {
                          id: 'all',
                          label: 'All 5 Categories (Grouped)',
                          count: draftMattresses.mattressModels.length,
                        },
                        {
                          id: 'orthopedic',
                          label: '1. Orthopedic',
                          count: draftMattresses.mattressModels.filter((m) =>
                            m.categories.includes('orthopedic')
                          ).length,
                        },
                        {
                          id: 'spring',
                          label: '2. Spring',
                          count: draftMattresses.mattressModels.filter((m) =>
                            m.categories.includes('spring')
                          ).length,
                        },
                        {
                          id: 'foam',
                          label: '3. Foam',
                          count: draftMattresses.mattressModels.filter((m) =>
                            m.categories.includes('foam')
                          ).length,
                        },
                        {
                          id: 'latex',
                          label: '4. Latex',
                          count: draftMattresses.mattressModels.filter((m) =>
                            m.categories.includes('latex')
                          ).length,
                        },
                        {
                          id: 'cooling',
                          label: '5. Cooling',
                          count: draftMattresses.mattressModels.filter((m) =>
                            m.categories.includes('cooling')
                          ).length,
                        },
                      ] as const
                    ).map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setMatCategoryFilter(cat.id)}
                        className={`min-h-[38px] px-3.5 py-1.5 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 ${
                          matCategoryFilter === cat.id
                            ? 'bg-[#0A2E73] text-white shadow-xs'
                            : 'bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73]'
                        }`}
                      >
                        <span>{cat.label}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                            matCategoryFilter === cat.id
                              ? 'bg-white/20 text-white'
                              : 'bg-[#0A2E73]/10 text-[#0A2E73]'
                          }`}
                        >
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category-Wise Sections (Orthopedic -> Spring -> Foam -> Latex -> Cooling) */}
                {(
                  [
                    {
                      id: 'orthopedic' as CatalogueCategoryId,
                      num: 1,
                      defaultTitle: 'Orthopedic Mattresses',
                      badgeColor: 'bg-rose-50 text-[#E3262E] border-rose-200',
                    },
                    {
                      id: 'spring' as CatalogueCategoryId,
                      num: 2,
                      defaultTitle: 'Spring Mattresses',
                      badgeColor: 'bg-blue-50 text-[#0A2E73] border-blue-200',
                    },
                    {
                      id: 'foam' as CatalogueCategoryId,
                      num: 3,
                      defaultTitle: 'Foam Mattresses',
                      badgeColor: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                    },
                    {
                      id: 'latex' as CatalogueCategoryId,
                      num: 4,
                      defaultTitle: 'Latex Mattresses',
                      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                    },
                    {
                      id: 'cooling' as CatalogueCategoryId,
                      num: 5,
                      defaultTitle: 'Cooling Mattresses',
                      badgeColor: 'bg-cyan-50 text-cyan-800 border-cyan-200',
                    },
                  ] as const
                )
                  .filter(
                    (catDef) =>
                      matCategoryFilter === 'all' ||
                      matCategoryFilter === catDef.id
                  )
                  .map((catDef) => {
                    const catMetaIdx =
                      draftMattresses.catalogueCategories.findIndex(
                        (c) => c.id === catDef.id
                      );
                    const catMeta =
                      catMetaIdx >= 0
                        ? draftMattresses.catalogueCategories[catMetaIdx]
                        : undefined;

                    const categoryProducts = draftMattresses.mattressModels
                      .map((m, idx) => ({ m, idx }))
                      .filter(({ m }) => {
                        if (!m.categories.includes(catDef.id)) return false;
                        const q = matSearchQuery.trim().toLowerCase();
                        return (
                          !q ||
                          m.name.toLowerCase().includes(q) ||
                          m.tagline.toLowerCase().includes(q)
                        );
                      });

                    return (
                      <div
                        key={catDef.id}
                        className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-5"
                      >
                        {/* Category Header Banner + Inline Category Title/Description + Add Product Button */}
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0]">
                          <div className="flex-1 space-y-2">
                            <div className="flex flex-wrap items-center gap-2.5">
                              <span
                                className={`px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider ${catDef.badgeColor}`}
                              >
                                Category {catDef.num} • {categoryProducts.length}{' '}
                                {categoryProducts.length === 1
                                  ? 'Product'
                                  : 'Products'}
                              </span>
                              <h3 className="text-lg sm:text-xl font-serif font-bold text-[#071F52]">
                                {catMeta?.label || catDef.defaultTitle}
                              </h3>
                            </div>

                            {catMeta && catMetaIdx >= 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5">
                                    Category Heading
                                  </label>
                                  <input
                                    type="text"
                                    value={catMeta.label}
                                    onChange={(e) => {
                                      const nextCats = [
                                        ...draftMattresses.catalogueCategories,
                                      ];
                                      nextCats[catMetaIdx] = {
                                        ...nextCats[catMetaIdx],
                                        label: e.target.value,
                                      };
                                      setDraftMattresses({
                                        ...draftMattresses,
                                        catalogueCategories: nextCats,
                                      });
                                    }}
                                    className="w-full min-h-[36px] px-3 py-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                                  />
                                </div>
                                <div className="md:col-span-2">
                                  <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-0.5">
                                    Category Description (Shown on Storefront)
                                  </label>
                                  <input
                                    type="text"
                                    value={catMeta.description}
                                    onChange={(e) => {
                                      const nextCats = [
                                        ...draftMattresses.catalogueCategories,
                                      ];
                                      nextCats[catMetaIdx] = {
                                        ...nextCats[catMetaIdx],
                                        description: e.target.value,
                                      };
                                      setDraftMattresses({
                                        ...draftMattresses,
                                        catalogueCategories: nextCats,
                                      });
                                    }}
                                    className="w-full min-h-[36px] px-3 py-1 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-[#475569] outline-none"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => handleAddNewMattressModel(catDef.id)}
                            className="min-h-[42px] px-4 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs transition-all"
                          >
                            <Plus className="w-4 h-4" />
                            <span>
                              + Add to {catMeta?.shortLabel || catDef.defaultTitle}
                            </span>
                          </button>
                        </div>

                        {/* Products Grid Inside This Category */}
                        {categoryProducts.length === 0 ? (
                          <div className="py-8 text-center text-[#94A3B8]">
                            No mattresses found in this category. Click &ldquo;+ Add to{' '}
                            {catMeta?.shortLabel || catDef.defaultTitle}&rdquo; above to add one.
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                            {categoryProducts.map(({ m, idx }) => {
                              const updateQuickModel = (
                                patch: Partial<CatalogueMattressProduct>
                              ) => {
                                const nextModels = [
                                  ...draftMattresses.mattressModels,
                                ];
                                nextModels[idx] = {
                                  ...nextModels[idx],
                                  ...patch,
                                };
                                setDraftMattresses({
                                  ...draftMattresses,
                                  mattressModels: nextModels,
                                });
                              };

                              const quickScalePrices = (newStart: number) => {
                                if (!newStart || newStart <= 0) return;
                                const oldStart = m.startingPrice || 1;
                                const ratio = newStart / oldStart;
                                const nextMatrix = m.priceMatrix.map(
                                  (cell) => ({
                                    ...cell,
                                    mrp: Number((cell.mrp * ratio).toFixed(2)),
                                  })
                                );
                                const allMrps = nextMatrix.map((c) => c.mrp);
                                updateQuickModel({
                                  startingPrice: newStart,
                                  maxPrice:
                                    allMrps.length > 0
                                      ? Math.max(...allMrps)
                                      : Math.round(newStart * 2.5),
                                  priceMatrix: nextMatrix,
                                });
                                showToast(
                                  `Updated starting price & scaled all 17 sizes for "${m.name}".`
                                );
                              };

                              const isCoolingCat = catDef.id === 'cooling';
                              const displayImg =
                                isCoolingCat && m.images.coolingHero
                                  ? m.images.coolingHero
                                  : m.images.hero;
                              const uploadImgKey = `quick-${catDef.id}-hero-${idx}`;

                              return (
                                <div
                                  key={`${catDef.id}-${m.id}-${idx}`}
                                  className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#0A2E73] transition-all flex flex-col justify-between"
                                >
                                  <div>
                                    {/* Image Header with 1-Click Photo Upload */}
                                    <div className="relative h-52 bg-white border-b border-[#E2E8F0] overflow-hidden flex items-center justify-center p-2">
                                      <img
                                        src={displayImg}
                                        alt={m.name}
                                        className="max-w-full max-h-full w-auto h-auto object-contain"
                                      />
                                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0A2E73]/95 text-white text-[10.5px] font-bold shadow-sm">
                                        {m.warrantyMonths}M Warranty
                                      </span>
                                      <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/95 text-[#071F52] font-mono text-[10px] font-bold border border-[#E2E8F0] shadow-2xs">
                                        #{idx + 1} • {m.topFinishStyle}
                                      </span>
                                      {displayImg?.startsWith('data:image/') && (
                                        <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold shadow-xs">
                                          ✓ Uploaded Photo
                                        </span>
                                      )}

                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleHomeImageUpload(
                                            'product-images',
                                            uploadImgKey,
                                            m.name,
                                            (url) =>
                                              updateQuickModel({
                                                images: {
                                                  ...m.images,
                                                  hero: url,
                                                  coolingHero: url,
                                                },
                                              })
                                          )
                                        }
                                        className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                                      >
                                        <Upload className="w-3.5 h-3.5" />
                                        <span>
                                          {uploadingFieldKey === uploadImgKey
                                            ? 'Uploading...'
                                            : 'Change Photo'}
                                        </span>
                                      </button>
                                    </div>

                                    {/* Quick Inline Fields */}
                                    <div className="p-4 space-y-3">
                                      {/* Live Storefront Card Preview Line */}
                                      <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
                                        <p className="text-xs font-semibold text-[#071F52] line-clamp-1">
                                          {m.name} — {m.tagline}
                                        </p>
                                        <div className="flex items-baseline gap-2">
                                          <span className="text-sm font-extrabold text-[#0A2E73]">
                                            ₹{Number(m.startingPrice || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                          <span className="text-[11px] text-[#94A3B8] line-through">
                                            ₹{Math.round(Number(m.startingPrice || 0) * 1.12).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                          </span>
                                        </div>
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                          Mattress Name
                                        </label>
                                        <input
                                          type="text"
                                          value={m.name}
                                          onChange={(e) =>
                                            updateQuickModel({
                                              name: e.target.value,
                                            })
                                          }
                                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-sm text-[#071F52] outline-none focus:border-[#0A2E73]"
                                        />
                                      </div>

                                      <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                          Subtitle / Tagline
                                        </label>
                                        <input
                                          type="text"
                                          value={m.tagline}
                                          onChange={(e) =>
                                            updateQuickModel({
                                              tagline: e.target.value,
                                            })
                                          }
                                          className="w-full min-h-[36px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#475569] outline-none focus:border-[#0A2E73]"
                                        />
                                      </div>

                                      <div className="grid grid-cols-2 gap-2.5">
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                            Starting Price (₹)
                                          </label>
                                          <div className="flex gap-1">
                                            <input
                                              type="number"
                                              value={m.startingPrice}
                                              onChange={(e) =>
                                                updateQuickModel({
                                                  startingPrice:
                                                    Number(e.target.value) || 0,
                                                })
                                              }
                                              className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-[#0A2E73] outline-none"
                                            />
                                            <button
                                              type="button"
                                              onClick={() =>
                                                quickScalePrices(
                                                  m.startingPrice
                                                )
                                              }
                                              className="px-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white text-[10px] font-bold shrink-0 cursor-pointer"
                                              title="Automatically scale all 17 bed size prices from this starting price"
                                            >
                                              Auto-Scale
                                            </button>
                                          </div>
                                        </div>

                                        <div>
                                          <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                            Warranty (Months)
                                          </label>
                                          <input
                                            type="number"
                                            value={m.warrantyMonths}
                                            onChange={(e) => {
                                              const wm =
                                                Number(e.target.value) || 24;
                                              updateQuickModel({
                                                warrantyMonths: wm,
                                                warrantyYears:
                                                  Math.round((wm / 12) * 10) /
                                                  10,
                                              });
                                            }}
                                            className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-semibold outline-none"
                                          />
                                        </div>
                                      </div>

                                      {/* Quick Category Pills */}
                                      <div>
                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                          Assigned Categories (Click to Toggle)
                                        </span>
                                        <div className="flex flex-wrap gap-1">
                                          {(
                                            [
                                              'orthopedic',
                                              'spring',
                                              'foam',
                                              'latex',
                                              'cooling',
                                            ] as CatalogueCategoryId[]
                                          ).map((catId) => {
                                            const active =
                                              m.categories.includes(catId);
                                            return (
                                              <button
                                                key={catId}
                                                type="button"
                                                onClick={() => {
                                                  const nextCats = active
                                                    ? m.categories.filter(
                                                        (c) => c !== catId
                                                      )
                                                    : [
                                                        ...m.categories,
                                                        catId,
                                                      ];
                                                  if (nextCats.length > 0) {
                                                    updateQuickModel({
                                                      categories: nextCats,
                                                    });
                                                  }
                                                }}
                                                className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase cursor-pointer border transition-all ${
                                                  active
                                                    ? 'bg-[#0A2E73] text-white border-[#0A2E73]'
                                                    : 'bg-white text-[#64748B] border-[#E2E8F0]'
                                                }`}
                                              >
                                                {catId}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Card Footer Actions */}
                                  <div className="px-4 py-3 bg-white border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsCreatingNewMattress(false);
                                        setSelectedModelIdx(idx);
                                        setMatDetailStep('basic');
                                        setMatSubTab('models');
                                      }}
                                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold text-[11px] cursor-pointer transition-colors"
                                    >
                                      Edit Layers, Features &amp; 17 Sizes →
                                    </button>

                                    {draftMattresses.mattressModels.length >
                                      1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setPendingDeleteProduct({
                                            type: 'mattress',
                                            id: m.id,
                                            name: m.name,
                                            image: m.images.hero,
                                            price: m.startingPrice,
                                            index: idx,
                                          })
                                        }
                                        className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                                        title="Delete Mattress"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 1: FULL-SCREEN SPECIFIC MATTRESS EDITOR             */}
            {/* ----------------------------------------------------------- */}
            {matSubTab === 'models' && (
              <div className="fixed inset-0 z-50 bg-[#F8FAFC] overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6 text-xs">
                  {(() => {
                    const model =
                      draftMattresses.mattressModels[selectedModelIdx] ||
                      draftMattresses.mattressModels[0];
                    if (!model) return null;

                    const updateModel = (patch: Partial<CatalogueMattressProduct>) => {
                      const nextModels = [...draftMattresses.mattressModels];
                      nextModels[selectedModelIdx] = {
                        ...nextModels[selectedModelIdx],
                        ...patch,
                      };
                      setDraftMattresses({
                        ...draftMattresses,
                        mattressModels: nextModels,
                      });
                    };

                    const scaleAllPricesByNewStartingPrice = (newStart: number) => {
                      if (!newStart || newStart <= 0) return;
                      const oldStart = model.startingPrice || 1;
                      const ratio = newStart / oldStart;
                      const nextMatrix = model.priceMatrix.map((cell) => ({
                        ...cell,
                        mrp: Number((cell.mrp * ratio).toFixed(2)),
                      }));
                      const allMrps = nextMatrix.map((c) => c.mrp);
                      updateModel({
                        startingPrice: newStart,
                        maxPrice:
                          allMrps.length > 0
                            ? Math.max(...allMrps)
                            : Math.round(newStart * 2.5),
                        priceMatrix: nextMatrix,
                      });
                      showToast(
                        `Scaled all ${nextMatrix.length} size/thickness prices for "${model.name}"!`
                      );
                    };

                    const adjustAllPricesByPercent = (pct: number) => {
                      const factor = 1 + pct / 100;
                      const nextMatrix = model.priceMatrix.map((cell) => ({
                        ...cell,
                        mrp: Math.round(cell.mrp * factor),
                      }));
                      const allMrps = nextMatrix.map((c) => c.mrp);
                      updateModel({
                        startingPrice:
                          allMrps.length > 0
                            ? Math.min(...allMrps)
                            : Math.round(model.startingPrice * factor),
                        maxPrice:
                          allMrps.length > 0
                            ? Math.max(...allMrps)
                            : Math.round(model.maxPrice * factor),
                        priceMatrix: nextMatrix,
                      });
                      showToast(
                        `Adjusted all prices for "${model.name}" by ${pct > 0 ? `+${pct}%` : `${pct}%`}!`
                      );
                    };

                    return (
                      <>
                        {/* Sticky Full-Screen Top Action Bar */}
                        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNewMattress(false);
                                setMatSubTab('quick-grid');
                              }}
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#071F52] hover:bg-[#0A2E73] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Back to Category-Wise Mattresses</span>
                            </button>

                            {isCreatingNewMattress ? (
                              <span className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5">
                                <Plus className="w-4 h-4 text-emerald-600" />
                                <span>Add New Product Page — Creating #{selectedModelIdx + 1}</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                                  Switch Mattress:
                                </span>
                                <select
                                  aria-label="Switch Mattress Model"
                                  value={selectedModelIdx}
                                  onChange={(e) => setSelectedModelIdx(Number(e.target.value))}
                                  className="bg-transparent text-xs font-bold text-[#0A2E73] outline-none cursor-pointer"
                                >
                                  {draftMattresses.mattressModels.map((m, idx) => (
                                    <option key={`${m.id}-${idx}`} value={idx}>
                                      #{idx + 1} — {m.name} ({m.categories.join(', ')})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => handleAddNewMattressModel()}
                              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0A2E73] text-xs font-bold cursor-pointer transition-colors"
                            >
                              + Add New Product
                            </button>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {isCreatingNewMattress ? (
                              <button
                                type="button"
                                onClick={handleCancelNewMattressDraft}
                                className="min-h-[42px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer transition-colors"
                              >
                                Cancel &amp; Discard Draft
                              </button>
                            ) : (
                              draftMattresses.mattressModels.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingDeleteProduct({
                                      type: 'mattress',
                                      id: model.id,
                                      name: model.name,
                                      image: model.images.hero,
                                      price: model.startingPrice,
                                      index: selectedModelIdx,
                                    })
                                  }
                                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                  title="Delete Mattress Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Product</span>
                                </button>
                              )
                            )}

                            <button
                              type="button"
                              onClick={handleSaveCompleteMattresses}
                              disabled={isSavingMattresses}
                              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#E3262E] hover:bg-[#C81E25] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                            >
                              <Save className="w-4 h-4" />
                              <span>
                                {isSavingMattresses
                                  ? 'Saving...'
                                  : isCreatingNewMattress
                                    ? 'Create & Publish Product'
                                    : 'Save Mattress Changes'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNewMattress(false);
                                setMatSubTab('quick-grid');
                              }}
                              className="w-10 h-10 rounded-xl bg-[#F8FAFC] hover:bg-rose-50 text-[#475569] hover:text-rose-600 border border-[#E2E8F0] flex items-center justify-center cursor-pointer"
                              title="Close Full-Screen Editor"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Easy 3-Step Switcher inside Selected Mattress */}
                        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-2 flex flex-wrap items-center gap-2 shadow-2xs">
                          {[
                            {
                              id: 'basic' as const,
                              label: 'Step 1: Basic Info, Pricing & Photos',
                            },
                            {
                              id: 'features-layers' as const,
                              label: `Step 2: Key Features (${model.features.length}) & Internal Layers (${model.layers.length})`,
                            },
                            {
                              id: 'price-matrix' as const,
                              label: 'Step 3: 17-Size Price Table & Bulk Adjust',
                            },
                          ].map((st) => (
                            <button
                              key={st.id}
                              type="button"
                              onClick={() => setMatDetailStep(st.id)}
                              className={`flex-1 min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all ${
                                matDetailStep === st.id
                                  ? 'bg-[#0A2E73] text-white shadow-xs'
                                  : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#DBEAFE]/50'
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>

                        {/* STEP 1: BASIC INFO, PRICING & PHOTOS */}
                        {matDetailStep === 'basic' && (
                          <>
                            {/* Card 1: Basic Identity, Categories, Finish, Warranty & Pricing */}
                            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
                                <div>
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                                    Editing Mattress Model #{selectedModelIdx + 1}
                                  </span>
                                  <h3 className="text-lg font-bold text-[#071F52]">
                                    {model.name} — {model.tagline}
                                  </h3>
                                </div>
                                <span className="px-3 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] font-mono text-[11px] text-[#0A2E73]">
                                  Slug: {model.slug}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1">
                                    Mattress Name
                                  </label>
                                  <input
                                    type="text"
                                    value={model.name}
                                    onChange={(e) =>
                                      updateModel({ name: e.target.value })
                                    }
                                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1">
                                    URL Slug / ID
                                  </label>
                                  <input
                                    type="text"
                                    value={model.slug}
                                    onChange={(e) =>
                                      updateModel({
                                        slug: e.target.value,
                                        id: e.target.value,
                                      })
                                    }
                                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                  />
                                </div>
                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1">
                                    Tagline
                                  </label>
                                  <input
                                    type="text"
                                    value={model.tagline}
                                    onChange={(e) =>
                                      updateModel({ tagline: e.target.value })
                                    }
                                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block font-semibold text-[#0F2952] mb-1">
                                  Short Description (Shown on Product Detail Page)
                                </label>
                                <textarea
                                  rows={2}
                                  value={model.shortDescription}
                                  onChange={(e) =>
                                    updateModel({ shortDescription: e.target.value })
                                  }
                                  className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                />
                              </div>

                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1">
                                    Starting Price (₹)
                                  </label>
                                  <div className="flex gap-1.5">
                                    <input
                                      type="number"
                                      step="0.01"
                                      value={model.startingPrice}
                                      onChange={(e) =>
                                        updateModel({
                                          startingPrice:
                                            Number(e.target.value) || 0,
                                        })
                                      }
                                      className="w-full min-h-[42px] px-2.5 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#0A2E73] outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        scaleAllPricesByNewStartingPrice(
                                          model.startingPrice
                                        )
                                      }
                                      className="px-2.5 rounded-xl bg-[#0A2E73] text-white text-[10px] font-bold shrink-0 cursor-pointer"
                                      title="Scale all 17 size prices proportionally to match this starting price"
                                    >
                                      Scale 17 Sizes
                                    </button>
                                  </div>
                                </div>

                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1">
                                    Max Price (₹)
                                  </label>
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={model.maxPrice}
                                    onChange={(e) =>
                                      updateModel({
                                        maxPrice: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1">
                                    Warranty (Months)
                                  </label>
                                  <input
                                    type="number"
                                    value={model.warrantyMonths}
                                    onChange={(e) => {
                                      const m = Number(e.target.value) || 24;
                                      updateModel({
                                        warrantyMonths: m,
                                        warrantyYears:
                                          Math.round((m / 12) * 10) / 10,
                                      });
                                    }}
                                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                  />
                                </div>

                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1">
                                    Top Finish Style
                                  </label>
                                  <select
                                    value={model.topFinishStyle}
                                    onChange={(e) =>
                                      updateModel({
                                        topFinishStyle: e.target
                                          .value as TopFinishStyle,
                                      })
                                    }
                                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                  >
                                    <option value="Normal / Tight Top">
                                      Normal / Tight Top
                                    </option>
                                    <option value="Pillow Top">Pillow Top</option>
                                    <option value="Euro / Box Top">
                                      Euro / Box Top
                                    </option>
                                    <option value="Dual-Side Reversible">
                                      Dual-Side Reversible
                                    </option>
                                  </select>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1.5">
                                    Construction Family
                                  </label>
                                  <select
                                    value={model.constructionFamily}
                                    onChange={(e) =>
                                      updateModel({
                                        constructionFamily: e.target
                                          .value as ConstructionFamily,
                                      })
                                    }
                                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                  >
                                    <option value="Foam Core">Foam Core</option>
                                    <option value="Bonnell Spring">
                                      Bonnell Spring
                                    </option>
                                    <option value="Pocket Spring">
                                      Pocket Spring
                                    </option>
                                    <option value="Orthopedic Coir & Foam">
                                      Orthopedic Coir &amp; Foam
                                    </option>
                                    <option value="Natural Latex Hybrid">
                                      Natural Latex Hybrid
                                    </option>
                                  </select>
                                </div>

                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1.5">
                                    Assigned Categories (Multi-Select)
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(
                                      [
                                        'foam',
                                        'spring',
                                        'orthopedic',
                                        'latex',
                                        'cooling',
                                      ] as CatalogueCategoryId[]
                                    ).map((catId) => {
                                      const checked =
                                        model.categories.includes(catId);
                                      return (
                                        <button
                                          key={catId}
                                          type="button"
                                          onClick={() => {
                                            const nextCats = checked
                                              ? model.categories.filter(
                                                  (c) => c !== catId
                                                )
                                              : [...model.categories, catId];
                                            if (nextCats.length > 0) {
                                              updateModel({
                                                categories: nextCats,
                                              });
                                            }
                                          }}
                                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold uppercase cursor-pointer border transition-all ${
                                            checked
                                              ? 'bg-[#0A2E73] text-white border-[#0A2E73]'
                                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                                          }`}
                                        >
                                          {catId}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>

                                <div>
                                  <label className="block font-semibold text-[#0F2952] mb-1.5">
                                    Thickness Options (Inches)
                                  </label>
                                  <div className="flex flex-wrap gap-1.5">
                                    {[5, 6, 8, 10].map((th) => {
                                      const active =
                                        model.thicknessOptions.includes(th);
                                      return (
                                        <button
                                          key={th}
                                          type="button"
                                          onClick={() => {
                                            const nextTh = active
                                              ? model.thicknessOptions.filter(
                                                  (t) => t !== th
                                                )
                                              : [
                                                  ...model.thicknessOptions,
                                                  th,
                                                ].sort((a, b) => a - b);
                                            if (nextTh.length > 0) {
                                              updateModel({
                                                thicknessOptions: nextTh,
                                              });
                                            }
                                          }}
                                          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold cursor-pointer border transition-all ${
                                            active
                                              ? 'bg-[#E3262E] text-white border-[#E3262E]'
                                              : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                                          }`}
                                        >
                                          {th}&quot;
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Mattress Images (Hero, Cooling Hero, Layer Diagram) */}
                            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                              <h4 className="text-sm font-bold text-[#071F52]">
                                Mattress Photography &amp; Layer Diagram
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {/* Hero Image */}
                                <div className="space-y-2">
                                  <span className="font-semibold text-[#0F2952] block">
                                    Primary Hero Image
                                  </span>
                                  <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center p-2">
                                    <img
                                      src={model.images.hero}
                                      alt={model.name}
                                      className="max-w-full max-h-full w-auto h-auto object-contain"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleHomeImageUpload(
                                          'product-images',
                                          `mat-hero-${selectedModelIdx}`,
                                          model.name,
                                          (url) =>
                                            updateModel({
                                              images: {
                                                ...model.images,
                                                hero: url,
                                                coolingHero: url,
                                              },
                                            })
                                        )
                                      }
                                      className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>
                                        {uploadingFieldKey ===
                                        `mat-hero-${selectedModelIdx}`
                                          ? '...'
                                          : 'Upload Image'}
                                      </span>
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={formatImageInputValue(model.images.hero)}
                                    placeholder={getImageInputPlaceholder(model.images.hero)}
                                    onChange={(e) =>
                                      updateModel({
                                        images: {
                                          ...model.images,
                                          hero: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] outline-none"
                                  />
                                </div>

                                {/* Cooling Edition Hero Image */}
                                <div className="space-y-2">
                                  <span className="font-semibold text-[#0F2952] block">
                                    Cooling Category Card Image (Optional)
                                  </span>
                                  <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center p-2">
                                    <img
                                      src={
                                        model.images.coolingHero ||
                                        model.images.hero
                                      }
                                      alt={`${model.name} Cooling`}
                                      className="max-w-full max-h-full w-auto h-auto object-contain"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleHomeImageUpload(
                                          'product-images',
                                          `mat-cool-${selectedModelIdx}`,
                                          `${model.name} Cooling`,
                                          (url) =>
                                            updateModel({
                                              images: {
                                                ...model.images,
                                                coolingHero: url,
                                              },
                                            })
                                        )
                                      }
                                      className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>
                                        {uploadingFieldKey ===
                                        `mat-cool-${selectedModelIdx}`
                                          ? '...'
                                          : 'Upload Image'}
                                      </span>
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={formatImageInputValue(model.images.coolingHero || '')}
                                    placeholder={getImageInputPlaceholder(
                                      model.images.coolingHero,
                                      'Defaults to Primary Hero Image'
                                    )}
                                    onChange={(e) =>
                                      updateModel({
                                        images: {
                                          ...model.images,
                                          coolingHero:
                                            e.target.value || undefined,
                                        },
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] outline-none"
                                  />
                                </div>

                                {/* Layer Anatomy Diagram Image */}
                                <div className="space-y-2">
                                  <span className="font-semibold text-[#0F2952] block">
                                    Internal Layer Diagram Image
                                  </span>
                                  <div className="relative h-44 sm:h-48 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center p-2">
                                    <img
                                      src={model.images.layers}
                                      alt={`${model.name} Layers`}
                                      className="max-w-full max-h-full w-auto h-auto object-contain"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleHomeImageUpload(
                                          'product-images',
                                          `mat-layers-${selectedModelIdx}`,
                                          `${model.name} Layers`,
                                          (url) =>
                                            updateModel({
                                              images: {
                                                ...model.images,
                                                layers: url,
                                              },
                                            })
                                        )
                                      }
                                      className="absolute bottom-2 right-2 px-2.5 py-1.5 rounded-lg bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white text-[10.5px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
                                    >
                                      <Upload className="w-3 h-3" />
                                      <span>
                                        {uploadingFieldKey ===
                                        `mat-layers-${selectedModelIdx}`
                                          ? '...'
                                          : 'Upload Image'}
                                      </span>
                                    </button>
                                  </div>
                                  <input
                                    type="text"
                                    value={formatImageInputValue(model.images.layers)}
                                    placeholder={getImageInputPlaceholder(model.images.layers)}
                                    onChange={(e) =>
                                      updateModel({
                                        images: {
                                          ...model.images,
                                          layers: e.target.value,
                                        },
                                      })
                                    }
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-[#F8FAFC] text-[11px] outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                          </>
                        )}

                        {/* STEP 2: KEY FEATURES & INTERNAL LAYERS */}
                        {matDetailStep === 'features-layers' && (
                          <>
                            {/* Card 3: Key Features Bullet Points Editor */}
                            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-[#071F52]">
                                  Key Features &amp; Highlights ({model.features.length})
                                </h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateModel({
                                      features: [
                                        ...model.features,
                                        'New Mindfree Feature Highlight',
                                      ],
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-[#0A2E73] text-white text-[11px] font-bold cursor-pointer"
                                >
                                  + Add Feature
                                </button>
                              </div>

                              <div className="space-y-2">
                                {model.features.map((feat, fIdx) => (
                                  <div
                                    key={fIdx}
                                    className="flex items-center gap-2"
                                  >
                                    <input
                                      type="text"
                                      value={feat}
                                      onChange={(e) => {
                                        const nextFeat = [...model.features];
                                        nextFeat[fIdx] = e.target.value;
                                        updateModel({ features: nextFeat });
                                      }}
                                      className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                    />
                                    <button
                                      type="button"
                                      onClick={() =>
                                        updateModel({
                                          features: model.features.filter(
                                            (_, i) => i !== fIdx
                                          ),
                                        })
                                      }
                                      className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Card 4: Internal Layer Anatomy Editor */}
                            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-[#071F52]">
                                  Internal Layer Anatomy ({model.layers.length} Layers)
                                </h4>
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateModel({
                                      layers: [
                                        ...model.layers,
                                        {
                                          order: model.layers.length + 1,
                                          name: 'NEW COMFORT LAYER',
                                          material: 'High Resilience Foam',
                                          density: '32 Density',
                                          thicknessMm: 25,
                                          purpose:
                                            'Provides pressure relief and postural support',
                                          colorHex: '#6495ED',
                                        },
                                      ],
                                    })
                                  }
                                  className="px-3 py-1.5 rounded-xl bg-[#0A2E73] text-white text-[11px] font-bold cursor-pointer"
                                >
                                  + Add Internal Layer
                                </button>
                              </div>

                              <div className="space-y-3">
                                {model.layers.map((layer, lIdx) => (
                                  <div
                                    key={lIdx}
                                    className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
                                  >
                                    <div className="flex items-center justify-between">
                                      <span className="font-bold text-[#0A2E73]">
                                        Layer #{lIdx + 1}: {layer.name}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updateModel({
                                            layers: model.layers
                                              .filter((_, i) => i !== lIdx)
                                              .map((l, idx2) => ({
                                                ...l,
                                                order: idx2 + 1,
                                              })),
                                          })
                                        }
                                        className="text-rose-600 hover:underline text-[11px] font-semibold cursor-pointer"
                                      >
                                        Remove Layer
                                      </button>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                                      <input
                                        type="text"
                                        value={layer.name}
                                        onChange={(e) => {
                                          const nextLayers = [...model.layers];
                                          nextLayers[lIdx] = {
                                            ...nextLayers[lIdx],
                                            name: e.target.value,
                                          };
                                          updateModel({ layers: nextLayers });
                                        }}
                                        placeholder="Layer Title"
                                        className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={layer.material}
                                        onChange={(e) => {
                                          const nextLayers = [...model.layers];
                                          nextLayers[lIdx] = {
                                            ...nextLayers[lIdx],
                                            material: e.target.value,
                                          };
                                          updateModel({ layers: nextLayers });
                                        }}
                                        placeholder="Material"
                                        className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={layer.density || ''}
                                        onChange={(e) => {
                                          const nextLayers = [...model.layers];
                                          nextLayers[lIdx] = {
                                            ...nextLayers[lIdx],
                                            density:
                                              e.target.value || undefined,
                                          };
                                          updateModel({ layers: nextLayers });
                                        }}
                                        placeholder="Density (e.g. 32 Density)"
                                        className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white outline-none"
                                      />
                                      <input
                                        type="text"
                                        value={layer.purpose}
                                        onChange={(e) => {
                                          const nextLayers = [...model.layers];
                                          nextLayers[lIdx] = {
                                            ...nextLayers[lIdx],
                                            purpose: e.target.value,
                                          };
                                          updateModel({ layers: nextLayers });
                                        }}
                                        placeholder="Purpose / Benefit"
                                        className="px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white outline-none"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </>
                        )}

                        {/* STEP 3: 17-SIZE PRICE MATRIX & BULK ADJUST */}
                        {matDetailStep === 'price-matrix' && (
                          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <div>
                                <h4 className="text-sm font-bold text-[#071F52]">
                                  17-Size &amp; Thickness Exact MRP Matrix (
                                  {model.priceMatrix.length} Price Cells)
                                </h4>
                                <p className="text-[11px] text-[#64748B]">
                                  Use the 1-click bulk buttons on the right or edit any individual bed size price below.
                                </p>
                              </div>

                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-[11px] font-bold text-[#64748B] mr-1">
                                  Bulk Adjust All Sizes:
                                </span>
                                {[-10, -5, 5, 10].map((pct) => (
                                  <button
                                    key={pct}
                                    type="button"
                                    onClick={() => adjustAllPricesByPercent(pct)}
                                    className={`px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer border transition-all ${
                                      pct < 0
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                        : 'bg-blue-50 text-[#0A2E73] border-blue-200 hover:bg-blue-100'
                                    }`}
                                  >
                                    {pct > 0 ? `+${pct}%` : `${pct}%`}
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div className="overflow-x-auto max-h-[520px] border border-[#E2E8F0] rounded-2xl">
                              <table className="w-full text-left border-collapse text-[11px]">
                                <thead className="sticky top-0 bg-[#F8FAFC] border-b border-[#E2E8F0] text-[#071F52]">
                                  <tr>
                                    <th className="py-2.5 px-3 font-bold">
                                      Size (Inches / Feet)
                                    </th>
                                    <th className="py-2.5 px-3 font-bold">
                                      Group
                                    </th>
                                    {model.thicknessOptions.map((th) => (
                                      <th key={th} className="py-2.5 px-3 font-bold">
                                        {th}&quot; MRP (₹)
                                      </th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#E2E8F0]">
                                  {STANDARD_CATALOGUE_SIZES.map((sz) => (
                                    <tr
                                      key={sz.sizeInches}
                                      className="hover:bg-[#F8FAFC]"
                                    >
                                      <td className="py-2 px-3 font-mono font-bold text-[#0A2E73]">
                                        {sz.sizeInches}&quot; ({sz.sizeFeet} ft)
                                      </td>
                                      <td className="py-2 px-3 text-[#64748B]">
                                        {sz.sizeGroup}
                                      </td>
                                      {model.thicknessOptions.map((th) => {
                                        const cellIdx =
                                          model.priceMatrix.findIndex(
                                            (v) =>
                                              v.lengthInches ===
                                                sz.lengthInches &&
                                              v.widthInches === sz.widthInches &&
                                              v.thicknessInches === th
                                          );
                                        const cell =
                                          cellIdx >= 0
                                            ? model.priceMatrix[cellIdx]
                                            : undefined;
                                        return (
                                          <td key={th} className="py-1.5 px-2">
                                            <input
                                              type="number"
                                              step="0.01"
                                              value={
                                                cell
                                                  ? cell.mrp
                                                  : model.startingPrice
                                              }
                                              onChange={(e) => {
                                                const val =
                                                  Number(e.target.value) || 0;
                                                const nextMatrix = [
                                                  ...model.priceMatrix,
                                                ];
                                                if (cellIdx >= 0) {
                                                  nextMatrix[cellIdx] = {
                                                    ...nextMatrix[cellIdx],
                                                    mrp: val,
                                                  };
                                                } else {
                                                  nextMatrix.push({
                                                    sizeFeet: sz.sizeFeet,
                                                    sizeInches: sz.sizeInches,
                                                    lengthInches:
                                                      sz.lengthInches,
                                                    widthInches: sz.widthInches,
                                                    thicknessInches: th,
                                                    mrp: val,
                                                    verified: true,
                                                  });
                                                }
                                                const allPrices = nextMatrix.map(
                                                  (c) => c.mrp
                                                );
                                                updateModel({
                                                  priceMatrix: nextMatrix,
                                                  startingPrice: Math.min(
                                                    ...allPrices
                                                  ),
                                                  maxPrice: Math.max(
                                                    ...allPrices
                                                  ),
                                                });
                                              }}
                                              className="w-28 px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white font-mono text-[11px] outline-none focus:border-[#0A2E73]"
                                            />
                                          </td>
                                        );
                                      })}
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 2: NAVBAR "MATTRESSES" MEGA-MENU DROPDOWN EDITOR    */}
            {/* ----------------------------------------------------------- */}
            {matSubTab === 'megamenu' && (
              <div className="space-y-6 text-xs">
                {/* Column 1 & Column 5: Campaign Panel + Right Lifestyle Banner */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Column 1: Left Brand Campaign Panel */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-[#071F52]">
                      Dropdown Column 1 — Left Brand Campaign Panel
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Eyebrow Text
                        </label>
                        <input
                          type="text"
                          value={draftMattresses.megaMenu.campaign.eyebrow}
                          onChange={(e) =>
                            setDraftMattresses({
                              ...draftMattresses,
                              megaMenu: {
                                ...draftMattresses.megaMenu,
                                campaign: {
                                  ...draftMattresses.megaMenu.campaign,
                                  eyebrow: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          CTA Button Text
                        </label>
                        <input
                          type="text"
                          value={draftMattresses.megaMenu.campaign.ctaText}
                          onChange={(e) =>
                            setDraftMattresses({
                              ...draftMattresses,
                              megaMenu: {
                                ...draftMattresses.megaMenu,
                                campaign: {
                                  ...draftMattresses.megaMenu.campaign,
                                  ctaText: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Headline Line 1
                        </label>
                        <input
                          type="text"
                          value={draftMattresses.megaMenu.campaign.headlineLine1}
                          onChange={(e) =>
                            setDraftMattresses({
                              ...draftMattresses,
                              megaMenu: {
                                ...draftMattresses.megaMenu,
                                campaign: {
                                  ...draftMattresses.megaMenu.campaign,
                                  headlineLine1: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Headline Line 2
                        </label>
                        <input
                          type="text"
                          value={draftMattresses.megaMenu.campaign.headlineLine2}
                          onChange={(e) =>
                            setDraftMattresses({
                              ...draftMattresses,
                              megaMenu: {
                                ...draftMattresses.megaMenu,
                                campaign: {
                                  ...draftMattresses.megaMenu.campaign,
                                  headlineLine2: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Highlight Word (Red)
                        </label>
                        <input
                          type="text"
                          value={draftMattresses.megaMenu.campaign.headlineHighlight}
                          onChange={(e) =>
                            setDraftMattresses({
                              ...draftMattresses,
                              megaMenu: {
                                ...draftMattresses.megaMenu,
                                campaign: {
                                  ...draftMattresses.megaMenu.campaign,
                                  headlineHighlight: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Campaign Description
                      </label>
                      <input
                        type="text"
                        value={draftMattresses.megaMenu.campaign.description}
                        onChange={(e) =>
                          setDraftMattresses({
                            ...draftMattresses,
                            megaMenu: {
                              ...draftMattresses.megaMenu,
                              campaign: {
                                ...draftMattresses.megaMenu.campaign,
                                description: e.target.value,
                              },
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={draftMattresses.megaMenu.campaign.image}
                        alt="Campaign"
                        className="w-28 h-24 rounded-xl object-contain p-1.5 border border-[#E2E8F0] bg-[#071F52]"
                      />
                      <div className="flex-1 space-y-1.5">
                        <input
                          type="text"
                          value={formatImageInputValue(draftMattresses.megaMenu.campaign.image)}
                          placeholder={getImageInputPlaceholder(draftMattresses.megaMenu.campaign.image)}
                          onChange={(e) =>
                            setDraftMattresses({
                              ...draftMattresses,
                              megaMenu: {
                                ...draftMattresses.megaMenu,
                                campaign: {
                                  ...draftMattresses.megaMenu.campaign,
                                  image: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            handleHomeImageUpload(
                              'media-uploads',
                              'mega-campaign-img',
                              'Mega Menu Campaign',
                              (url) =>
                                setDraftMattresses({
                                  ...draftMattresses,
                                  megaMenu: {
                                    ...draftMattresses.megaMenu,
                                    campaign: {
                                      ...draftMattresses.megaMenu.campaign,
                                      image: url,
                                    },
                                  },
                                })
                            )
                          }
                          className="px-3 py-1.5 rounded-lg bg-[#0A2E73] text-white text-[11px] font-bold cursor-pointer"
                        >
                          Upload Campaign Image
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Column 5: Right Lifestyle Bedroom Banner */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                    <h3 className="text-base font-bold text-[#071F52]">
                      Dropdown Column 5 — Right Lifestyle Bedroom Banner
                    </h3>
                    <div className="relative h-48 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-white flex items-center justify-center">
                      <img
                        src={draftMattresses.megaMenu.lifestyleBanner.image}
                        alt={draftMattresses.megaMenu.lifestyleBanner.altText}
                        className="w-full h-full object-contain p-1.5"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleHomeImageUpload(
                            'media-uploads',
                            'mega-lifestyle-img',
                            draftMattresses.megaMenu.lifestyleBanner.altText,
                            (url) =>
                              setDraftMattresses({
                                ...draftMattresses,
                                megaMenu: {
                                  ...draftMattresses.megaMenu,
                                  lifestyleBanner: {
                                    ...draftMattresses.megaMenu.lifestyleBanner,
                                    image: url,
                                  },
                                },
                              })
                          )
                        }
                        className="absolute bottom-2.5 right-2.5 px-3.5 py-2 rounded-xl bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Lifestyle Photo</span>
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Lifestyle Image URL
                        </label>
                        <input
                          type="text"
                          value={formatImageInputValue(draftMattresses.megaMenu.lifestyleBanner.image)}
                          placeholder={getImageInputPlaceholder(draftMattresses.megaMenu.lifestyleBanner.image)}
                          onChange={(e) =>
                            setDraftMattresses({
                              ...draftMattresses,
                              megaMenu: {
                                ...draftMattresses.megaMenu,
                                lifestyleBanner: {
                                  ...draftMattresses.megaMenu.lifestyleBanner,
                                  image: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Alt Text / Caption
                        </label>
                        <input
                          type="text"
                          value={draftMattresses.megaMenu.lifestyleBanner.altText}
                          onChange={(e) =>
                            setDraftMattresses({
                              ...draftMattresses,
                              megaMenu: {
                                ...draftMattresses.megaMenu,
                                lifestyleBanner: {
                                  ...draftMattresses.megaMenu.lifestyleBanner,
                                  altText: e.target.value,
                                },
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Columns 2, 3, 4: Shop by Type, By Core Material, By Top Design */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Column 2: Shop by Type */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-[#071F52]">
                      Dropdown Column 2 — Shop by Type (6 Items)
                    </h4>
                    <input
                      type="text"
                      value={draftMattresses.megaMenu.shopByTypeHeading}
                      onChange={(e) =>
                        setDraftMattresses({
                          ...draftMattresses,
                          megaMenu: {
                            ...draftMattresses.megaMenu,
                            shopByTypeHeading: e.target.value,
                          },
                        })
                      }
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                    />
                    <div className="space-y-2.5">
                      {draftMattresses.megaMenu.shopByTypeItems.map((item, idx) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5"
                        >
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-8 rounded-md object-contain bg-white border border-[#E2E8F0] shrink-0"
                          />
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const next = [...draftMattresses.megaMenu.shopByTypeItems];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setDraftMattresses({
                                  ...draftMattresses,
                                  megaMenu: {
                                    ...draftMattresses.megaMenu,
                                    shopByTypeItems: next,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white font-semibold outline-none"
                            />
                            <input
                              type="text"
                              value={item.image}
                              onChange={(e) => {
                                const next = [...draftMattresses.megaMenu.shopByTypeItems];
                                next[idx] = { ...next[idx], image: e.target.value };
                                setDraftMattresses({
                                  ...draftMattresses,
                                  megaMenu: {
                                    ...draftMattresses.megaMenu,
                                    shopByTypeItems: next,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white text-[10px] outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 3: By Core Material */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-[#071F52]">
                      Dropdown Column 3 — By Core Material (5 Items)
                    </h4>
                    <input
                      type="text"
                      value={draftMattresses.megaMenu.coreMaterialsHeading}
                      onChange={(e) =>
                        setDraftMattresses({
                          ...draftMattresses,
                          megaMenu: {
                            ...draftMattresses.megaMenu,
                            coreMaterialsHeading: e.target.value,
                          },
                        })
                      }
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                    />
                    <div className="space-y-2.5">
                      {draftMattresses.megaMenu.coreMaterialsItems.map((mat, idx) => (
                        <div
                          key={mat.id}
                          className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-2.5"
                        >
                          <img
                            src={mat.image}
                            alt={mat.name}
                            className="w-11 h-9 rounded-md object-contain p-0.5 bg-white border border-[#E2E8F0] shrink-0"
                          />
                          <div className="flex-1 space-y-1">
                            <input
                              type="text"
                              value={mat.name}
                              onChange={(e) => {
                                const next = [...draftMattresses.megaMenu.coreMaterialsItems];
                                next[idx] = { ...next[idx], name: e.target.value };
                                setDraftMattresses({
                                  ...draftMattresses,
                                  megaMenu: {
                                    ...draftMattresses.megaMenu,
                                    coreMaterialsItems: next,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white font-semibold outline-none"
                            />
                            <input
                              type="text"
                              value={mat.description}
                              onChange={(e) => {
                                const next = [...draftMattresses.megaMenu.coreMaterialsItems];
                                next[idx] = { ...next[idx], description: e.target.value };
                                setDraftMattresses({
                                  ...draftMattresses,
                                  megaMenu: {
                                    ...draftMattresses.megaMenu,
                                    coreMaterialsItems: next,
                                  },
                                });
                              }}
                              className="w-full px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white text-[10.5px] outline-none"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Column 4: By Top Design */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-[#071F52]">
                      Dropdown Column 4 — By Top Design (3 Cards)
                    </h4>
                    <input
                      type="text"
                      value={draftMattresses.megaMenu.topDesignsHeading}
                      onChange={(e) =>
                        setDraftMattresses({
                          ...draftMattresses,
                          megaMenu: {
                            ...draftMattresses.megaMenu,
                            topDesignsHeading: e.target.value,
                          },
                        })
                      }
                      className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                    />
                    <div className="space-y-2.5">
                      {draftMattresses.megaMenu.topDesignsItems.map((des, idx) => (
                        <div
                          key={des.id}
                          className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1.5"
                        >
                          <div className="flex items-center gap-2.5">
                            <img
                              src={des.image}
                              alt={des.name}
                              className="w-12 h-10 rounded-md object-contain p-0.5 bg-white border border-[#E2E8F0] shrink-0"
                            />
                            <div className="flex-1 space-y-1">
                              <input
                                type="text"
                                value={des.name}
                                onChange={(e) => {
                                  const next = [...draftMattresses.megaMenu.topDesignsItems];
                                  next[idx] = { ...next[idx], name: e.target.value };
                                  setDraftMattresses({
                                    ...draftMattresses,
                                    megaMenu: {
                                      ...draftMattresses.megaMenu,
                                      topDesignsItems: next,
                                    },
                                  });
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white font-semibold outline-none"
                              />
                              <input
                                type="text"
                                value={des.description}
                                onChange={(e) => {
                                  const next = [...draftMattresses.megaMenu.topDesignsItems];
                                  next[idx] = { ...next[idx], description: e.target.value };
                                  setDraftMattresses({
                                    ...draftMattresses,
                                    megaMenu: {
                                      ...draftMattresses.megaMenu,
                                      topDesignsItems: next,
                                    },
                                  });
                                }}
                                className="w-full px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white text-[10.5px] outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 3: CATALOGUE CATEGORY FILTER TABS EDITOR            */}
            {/* ----------------------------------------------------------- */}
            {matSubTab === 'categories' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-xs">
                {draftMattresses.catalogueCategories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="bg-white rounded-3xl border border-[#E2E8F0] p-5 shadow-xs space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase text-[#E3262E] font-bold">
                        Category ID: {cat.id}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Filter Pill / Section Title
                        </label>
                        <input
                          type="text"
                          value={cat.label}
                          onChange={(e) => {
                            const next = [...draftMattresses.catalogueCategories];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setDraftMattresses({
                              ...draftMattresses,
                              catalogueCategories: next,
                            });
                          }}
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Short Label
                        </label>
                        <input
                          type="text"
                          value={cat.shortLabel}
                          onChange={(e) => {
                            const next = [...draftMattresses.catalogueCategories];
                            next[idx] = { ...next[idx], shortLabel: e.target.value };
                            setDraftMattresses({
                              ...draftMattresses,
                              catalogueCategories: next,
                            });
                          }}
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Category Section Description
                      </label>
                      <textarea
                        rows={2}
                        value={cat.description}
                        onChange={(e) => {
                          const next = [...draftMattresses.catalogueCategories];
                          next[idx] = { ...next[idx], description: e.target.value };
                          setDraftMattresses({
                            ...draftMattresses,
                            catalogueCategories: next,
                          });
                        }}
                        className="w-full px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2B: COMPLETE PILLOWS PAGE & NAVBAR DROPDOWN VISUAL EDITOR    */}
        {/* =============================================================== */}
        {activeTab === 'pillows' && (
          <div className="space-y-6">
            {/* Top Action Bar */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E3262E] shrink-0" />
                  <h2 className="text-lg sm:text-xl font-serif font-bold text-[#071F52]">
                    Complete Pillows Page &amp; Navbar Dropdown Editor
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Edit every pillow model (prices, sizes, key features, care instructions, images), the Pillows Page Hero Banner &amp; Sleeper Posture Guide, and the Navbar &ldquo;Pillows&rdquo; Dropdown links.
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResetCompletePillows}
                  disabled={isSavingPillows}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-rose-50 hover:border-rose-200 text-xs font-semibold text-[#475569] hover:text-rose-700 inline-flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCompletePillows}
                  disabled={isSavingPillows}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E3262E] hover:bg-[#BE1820] text-white text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-md transition-all"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>
                    {isSavingPillows
                      ? 'Saving Pillows...'
                      : 'Save All Pillows & Dropdown'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sub-navigation pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'quick-grid' as const,
                  label: `1. Quick Pillows Cards (${draftPillows.pillowModels.length} Pillows)`,
                },
                {
                  id: 'models' as const,
                  label: `2. Full-Screen Specific Pillow Editor`,
                },
                {
                  id: 'hero-posture' as const,
                  label: '3. Pillows Page Hero Banner & Posture Guide',
                },
                {
                  id: 'dropdown' as const,
                  label: `4. Navbar "Pillows" Dropdown Links (${draftPillows.dropdownLinks.length} Links)`,
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setPilSubTab(st.id)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all ${
                    pilSubTab === st.id
                      ? 'bg-[#071F52] text-white shadow-xs'
                      : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* ------------------------------------------------------------- */}
            {/* SUB-TAB 0: QUICK PILLOWS CARDS GRID                           */}
            {/* ------------------------------------------------------------- */}
            {pilSubTab === 'quick-grid' && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[#E3262E] font-bold">
                      Ergonomic Pillows Collection
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      All Pillow Models ({draftPillows.pillowModels.length} Pillows)
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewPillowModel}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Pillow</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {draftPillows.pillowModels.map((p, idx) => {
                    const updateQuickPillow = (patch: Partial<AccessoryItem>) => {
                      const next = [...draftPillows.pillowModels];
                      next[idx] = { ...next[idx], ...patch };
                      setDraftPillows({ ...draftPillows, pillowModels: next });
                    };
                    const uploadKey = `quick-pil-img-${idx}`;

                    return (
                      <div
                        key={p.id || idx}
                        className="bg-[#F8FAFC] rounded-2xl border border-[#E2E8F0] overflow-hidden hover:border-[#0A2E73] transition-all flex flex-col justify-between"
                      >
                        <div>
                          {/* Image Header with 1-Click Photo Upload */}
                          <div className="relative h-52 bg-white border-b border-[#E2E8F0] overflow-hidden flex items-center justify-center p-2">
                            <img
                              src={p.image}
                              alt={p.name}
                              className="max-w-full max-h-full w-auto h-auto object-contain"
                            />
                            {p.badge && (
                              <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#0A2E73]/95 text-white text-[10.5px] font-bold shadow-sm">
                                {p.badge}
                              </span>
                            )}
                            <span className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/95 text-[#071F52] font-mono text-[10px] font-bold border border-[#E2E8F0] shadow-2xs">
                              Pillow #{idx + 1}
                            </span>
                            {p.image?.startsWith('data:image/') && (
                              <span className="absolute bottom-2.5 left-2.5 px-2 py-0.5 rounded-md bg-emerald-600/95 text-white text-[10px] font-bold shadow-xs">
                                ✓ Uploaded Photo
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() =>
                                handleHomeImageUpload(
                                  'pillow-images',
                                  uploadKey,
                                  p.name,
                                  (url) => updateQuickPillow({ image: url })
                                )
                              }
                              className="absolute bottom-2.5 right-2.5 px-3 py-1.5 rounded-xl bg-[#0A2E73]/95 hover:bg-[#E3262E] text-white text-[11px] font-bold inline-flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>
                                {uploadingFieldKey === uploadKey
                                  ? 'Uploading...'
                                  : 'Change Photo'}
                              </span>
                            </button>
                          </div>

                          {/* Quick Inline Fields */}
                          <div className="p-4 space-y-3 text-xs">
                            <div className="p-2.5 rounded-xl bg-white border border-[#E2E8F0] space-y-1">
                              <p className="text-xs font-semibold text-[#071F52] line-clamp-1">
                                {p.name}
                              </p>
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-extrabold text-[#0A2E73]">
                                  ₹{Number(p.price || 0).toLocaleString('en-IN')}
                                </span>
                                <span className="text-[11px] text-[#94A3B8] line-through">
                                  ₹{Number(p.originalPrice || 0).toLocaleString('en-IN')}
                                </span>
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                Pillow Name
                              </label>
                              <input
                                type="text"
                                value={p.name}
                                onChange={(e) => updateQuickPillow({ name: e.target.value })}
                                className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-sm text-[#071F52] outline-none focus:border-[#0A2E73]"
                              />
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                Subtitle / Tagline
                              </label>
                              <input
                                type="text"
                                value={p.tagline}
                                onChange={(e) => updateQuickPillow({ tagline: e.target.value })}
                                className="w-full min-h-[36px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-xs text-[#475569] outline-none focus:border-[#0A2E73]"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                  Selling Price (₹)
                                </label>
                                <input
                                  type="number"
                                  value={p.price}
                                  onChange={(e) =>
                                    updateQuickPillow({
                                      price: Number(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-[#0A2E73] outline-none"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                                  Original MRP (₹)
                                </label>
                                <input
                                  type="number"
                                  value={p.originalPrice}
                                  onChange={(e) =>
                                    updateQuickPillow({
                                      originalPrice: Number(e.target.value) || 0,
                                    })
                                  }
                                  className="w-full min-h-[38px] px-2.5 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-semibold outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="px-4 py-3 bg-white border-t border-[#E2E8F0] flex items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setIsCreatingNewPillow(false);
                              setSelectedPillowIdx(idx);
                              setPilSubTab('models');
                            }}
                            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold text-[11px] cursor-pointer transition-colors"
                          >
                            Edit Sizes, Features &amp; Full Details →
                          </button>

                          {draftPillows.pillowModels.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setPendingDeleteProduct({
                                  type: 'pillow',
                                  id: p.id,
                                  name: p.name,
                                  image: p.image,
                                  price: p.price,
                                  index: idx,
                                })
                              }
                              className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                              title="Delete Pillow"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-TAB 1: FULL-SCREEN SPECIFIC PILLOW EDITOR                 */}
            {/* ------------------------------------------------------------- */}
            {pilSubTab === 'models' && (
              <div className="fixed inset-0 z-50 bg-[#F8FAFC] overflow-y-auto p-4 sm:p-6 lg:p-8">
                <div className="max-w-[1600px] mx-auto space-y-6">
                  {(() => {
                    const pillow =
                      draftPillows.pillowModels[selectedPillowIdx] ||
                      draftPillows.pillowModels[0];
                    if (!pillow) return null;

                    const updatePillow = (patch: Partial<AccessoryItem>) => {
                      const next = [...draftPillows.pillowModels];
                      next[selectedPillowIdx] = { ...next[selectedPillowIdx], ...patch };
                      setDraftPillows({ ...draftPillows, pillowModels: next });
                    };

                    return (
                      <>
                        {/* Sticky Full-Screen Top Action Bar */}
                        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md rounded-2xl border border-[#E2E8F0] p-4 shadow-md flex flex-wrap items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNewPillow(false);
                                setPilSubTab('quick-grid');
                              }}
                              className="min-h-[42px] px-4 py-2 rounded-xl bg-[#071F52] hover:bg-[#0A2E73] text-white text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-colors"
                            >
                              <ArrowLeft className="w-4 h-4" />
                              <span>Back to All Pillows</span>
                            </button>

                            {isCreatingNewPillow ? (
                              <span className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold inline-flex items-center gap-1.5">
                                <Plus className="w-4 h-4 text-emerald-600" />
                                <span>Add New Pillow Page — Creating #{selectedPillowIdx + 1}</span>
                              </span>
                            ) : (
                              <div className="flex items-center gap-2 bg-[#F8FAFC] px-3 py-1.5 rounded-xl border border-[#E2E8F0]">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">
                                  Switch Pillow:
                                </span>
                                <select
                                  aria-label="Switch Pillow Model"
                                  value={selectedPillowIdx}
                                  onChange={(e) => setSelectedPillowIdx(Number(e.target.value))}
                                  className="bg-transparent text-xs font-bold text-[#0A2E73] outline-none cursor-pointer"
                                >
                                  {draftPillows.pillowModels.map((p, idx) => (
                                    <option key={`${p.id}-${idx}`} value={idx}>
                                      #{idx + 1} — {p.name} (₹{p.price})
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={handleAddNewPillowModel}
                              className="min-h-[40px] px-3.5 py-2 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0A2E73] text-xs font-bold cursor-pointer transition-colors"
                            >
                              + Add New Pillow
                            </button>
                          </div>

                          <div className="flex items-center gap-2.5">
                            {isCreatingNewPillow ? (
                              <button
                                type="button"
                                onClick={handleCancelNewPillowDraft}
                                className="min-h-[42px] px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold cursor-pointer transition-colors"
                              >
                                Cancel &amp; Discard Draft
                              </button>
                            ) : (
                              draftPillows.pillowModels.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setPendingDeleteProduct({
                                      type: 'pillow',
                                      id: pillow.id,
                                      name: pillow.name,
                                      image: pillow.image,
                                      price: pillow.price,
                                      index: selectedPillowIdx,
                                    })
                                  }
                                  className="min-h-[42px] px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                                  title="Delete Pillow Product"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Delete Pillow</span>
                                </button>
                              )
                            )}

                            <button
                              type="button"
                              onClick={handleSaveCompletePillows}
                              disabled={isSavingPillows}
                              className="min-h-[42px] px-5 py-2 rounded-xl bg-[#E3262E] hover:bg-[#C81E25] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-60"
                            >
                              <Save className="w-4 h-4" />
                              <span>
                                {isSavingPillows
                                  ? 'Saving...'
                                  : isCreatingNewPillow
                                    ? 'Create & Publish Pillow'
                                    : 'Save Pillow Changes'}
                              </span>
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setIsCreatingNewPillow(false);
                                setPilSubTab('quick-grid');
                              }}
                              className="w-10 h-10 rounded-xl bg-[#F8FAFC] hover:bg-rose-50 text-[#475569] hover:text-rose-600 border border-[#E2E8F0] flex items-center justify-center cursor-pointer"
                              title="Close Full-Screen Pillow Editor"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {/* Card 1: Core Identity, Badge, Pricing, Dimensions & Material */}
                        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 text-xs">
                          <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                            <div>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-[#E3262E]">
                                Editing Pillow #{selectedPillowIdx + 1} of{' '}
                                {draftPillows.pillowModels.length}
                              </span>
                              <h3 className="text-base font-bold text-[#071F52]">
                                {pillow.name} — Core Details, Pricing &amp; Specifications
                              </h3>
                            </div>
                            <span className="px-2.5 py-1 rounded-full bg-[#0A2E73]/10 text-[#0A2E73] font-mono text-[11px] font-bold">
                              SKU: {pillow.sku}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Pillow Name
                              </label>
                              <input
                                type="text"
                                value={pillow.name}
                                onChange={(e) => updatePillow({ name: e.target.value })}
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none font-bold text-[#071F52]"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Badge Text
                              </label>
                              <input
                                type="text"
                                value={pillow.badge || ''}
                                onChange={(e) => updatePillow({ badge: e.target.value })}
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div>
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Base SKU Code
                              </label>
                              <input
                                type="text"
                                value={pillow.sku}
                                onChange={(e) => updatePillow({ sku: e.target.value })}
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono outline-none"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Feel / Loft Badge (e.g. Medium-Firm Contoured Loft)
                              </label>
                              <input
                                type="text"
                                value={pillow.firmnessOrLoft}
                                onChange={(e) =>
                                  updatePillow({ firmnessOrLoft: e.target.value })
                                }
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Subtitle / Tagline
                            </label>
                            <textarea
                              rows={2}
                              value={pillow.tagline}
                              onChange={(e) => updatePillow({ tagline: e.target.value })}
                              className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div>
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Selling Price (₹)
                              </label>
                              <input
                                type="number"
                                value={pillow.price}
                                onChange={(e) =>
                                  updatePillow({ price: Number(e.target.value) || 0 })
                                }
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none font-bold text-[#0A2E73]"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Original MRP (₹)
                              </label>
                              <input
                                type="number"
                                value={pillow.originalPrice}
                                onChange={(e) =>
                                  updatePillow({
                                    originalPrice: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Star Rating (e.g. 4.9)
                              </label>
                              <input
                                type="number"
                                step="0.1"
                                min="1"
                                max="5"
                                value={pillow.rating}
                                onChange={(e) =>
                                  updatePillow({ rating: Number(e.target.value) || 4.9 })
                                }
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Reviews Count
                              </label>
                              <input
                                type="number"
                                value={pillow.reviewsCount}
                                onChange={(e) =>
                                  updatePillow({
                                    reviewsCount: Number(e.target.value) || 0,
                                  })
                                }
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Dimensions Spec
                              </label>
                              <input
                                type="text"
                                value={pillow.dimensions}
                                onChange={(e) => updatePillow({ dimensions: e.target.value })}
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                              />
                            </div>
                            <div>
                              <label className="block font-semibold text-[#0F2952] mb-1">
                                Core Material Spec
                              </label>
                              <input
                                type="text"
                                value={pillow.material}
                                onChange={(e) => updatePillow({ material: e.target.value })}
                                className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block font-semibold text-[#0F2952] mb-1">
                              Wash &amp; Care Instructions (One instruction per line)
                            </label>
                            <textarea
                              rows={3}
                              value={
                                Array.isArray(pillow.careInstructions)
                                  ? pillow.careInstructions.join('\n')
                                  : String(pillow.careInstructions || '')
                              }
                              onChange={(e) =>
                                updatePillow({
                                  careInstructions: e.target.value
                                    .split('\n')
                                    .map((s) => s.trim())
                                    .filter(Boolean),
                                })
                              }
                              className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                            />
                          </div>
                        </div>

                        {/* Card 2: Pillow Image & Upload */}
                        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 text-xs">
                          <h4 className="text-sm font-bold text-[#071F52] flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-[#E3262E]" />
                            <span>
                              Pillow Product Photo (Bucket:{' '}
                              <code className="font-mono text-[#0A2E73]">pillow-images</code>)
                            </span>
                          </h4>
                          <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-4">
                            <img
                              src={pillow.image}
                              alt={pillow.name}
                              className="w-44 h-36 rounded-xl object-contain p-2 bg-white border border-[#E2E8F0] shrink-0"
                            />
                            <div className="flex-1 w-full space-y-2">
                              <label className="block font-semibold text-[#0F2952]">
                                Image URL
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={formatImageInputValue(pillow.image)}
                                  placeholder={getImageInputPlaceholder(pillow.image)}
                                  onChange={(e) => updatePillow({ image: e.target.value })}
                                  className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-mono text-[11px] outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleHomeImageUpload(
                                      'pillow-images',
                                      `pil-img-${pillow.id}`,
                                      pillow.name,
                                      (url) => updatePillow({ image: url })
                                    )
                                  }
                                  className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 shrink-0 cursor-pointer"
                                >
                                  <Upload className="w-3.5 h-3.5" />
                                  <span>
                                    {uploadingFieldKey === `pil-img-${pillow.id}`
                                      ? 'Uploading...'
                                      : 'Upload Image'}
                                  </span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Card 3: Size & Pack Options + Key Features */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Size & Pack Variants */}
                          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-[#071F52]">
                                Size / Pack Options ({pillow.sizes.length})
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  updatePillow({
                                    sizes: [
                                      ...pillow.sizes,
                                      {
                                        id: `opt-${pillow.sizes.length + 1}`,
                                        label: 'King Size (28" × 18")',
                                        price: pillow.price + 500,
                                        sku: `${pillow.sku}-KNG`,
                                      },
                                    ],
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-[#0A2E73] text-white font-bold text-[11px] cursor-pointer"
                              >
                                + Add Size Option
                              </button>
                            </div>
                            <div className="space-y-2.5">
                              {pillow.sizes.map((sz, sIdx) => (
                                <div
                                  key={sIdx}
                                  className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <input
                                      type="text"
                                      value={sz.label}
                                      onChange={(e) => {
                                        const nextSizes = [...pillow.sizes];
                                        nextSizes[sIdx] = {
                                          ...nextSizes[sIdx],
                                          label: e.target.value,
                                        };
                                        updatePillow({ sizes: nextSizes });
                                      }}
                                      placeholder="Size Label"
                                      className="flex-1 min-h-[36px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white font-semibold outline-none"
                                    />
                                    {pillow.sizes.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          updatePillow({
                                            sizes: pillow.sizes.filter((_, i) => i !== sIdx),
                                          })
                                        }
                                        className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <span className="text-[10px] text-[#64748B] block mb-0.5">
                                        Option Price (₹)
                                      </span>
                                      <input
                                        type="number"
                                        value={sz.price}
                                        onChange={(e) => {
                                          const nextSizes = [...pillow.sizes];
                                          nextSizes[sIdx] = {
                                            ...nextSizes[sIdx],
                                            price: Number(e.target.value) || 0,
                                          };
                                          updatePillow({ sizes: nextSizes });
                                        }}
                                        className="w-full min-h-[36px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white font-bold text-[#0A2E73] outline-none"
                                      />
                                    </div>
                                    <div>
                                      <span className="text-[10px] text-[#64748B] block mb-0.5">
                                        Option SKU
                                      </span>
                                      <input
                                        type="text"
                                        value={sz.sku}
                                        onChange={(e) => {
                                          const nextSizes = [...pillow.sizes];
                                          nextSizes[sIdx] = {
                                            ...nextSizes[sIdx],
                                            sku: e.target.value,
                                          };
                                          updatePillow({ sizes: nextSizes });
                                        }}
                                        className="w-full min-h-[36px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white font-mono outline-none"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Key Features List */}
                          <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3 text-xs">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-[#071F52]">
                                Key Features ({pillow.keyFeatures.length})
                              </h4>
                              <button
                                type="button"
                                onClick={() =>
                                  updatePillow({
                                    keyFeatures: [
                                      ...pillow.keyFeatures,
                                      'New ergonomic sleep feature',
                                    ],
                                  })
                                }
                                className="px-2.5 py-1 rounded-lg bg-[#0A2E73] text-white font-bold text-[11px] cursor-pointer"
                              >
                                + Add Feature
                              </button>
                            </div>
                            <div className="space-y-2">
                              {pillow.keyFeatures.map((feat, fIdx) => (
                                <div key={fIdx} className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={feat}
                                    onChange={(e) => {
                                      const next = [...pillow.keyFeatures];
                                      next[fIdx] = e.target.value;
                                      updatePillow({ keyFeatures: next });
                                    }}
                                    className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updatePillow({
                                        keyFeatures: pillow.keyFeatures.filter(
                                          (_, i) => i !== fIdx
                                        ),
                                      })
                                    }
                                    className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-TAB 2: HERO BANNER, REASSURANCE STRIP & POSTURE GUIDE     */}
            {/* ------------------------------------------------------------- */}
            {pilSubTab === 'hero-posture' && (
              <div className="space-y-6 text-xs">
                {/* Hero Banner & Posture Promise Box */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-[#071F52]">
                    Pillows Page Hero Banner &amp; Posture Promise Card
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Hero Badge Text
                      </label>
                      <input
                        type="text"
                        value={draftPillows.heroBanner.badge}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            heroBanner: {
                              ...draftPillows.heroBanner,
                              badge: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Headline Main Line
                      </label>
                      <input
                        type="text"
                        value={draftPillows.heroBanner.headlineMain}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            heroBanner: {
                              ...draftPillows.heroBanner,
                              headlineMain: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Headline Highlight (Blue Accent Line)
                      </label>
                      <input
                        type="text"
                        value={draftPillows.heroBanner.headlineHighlight}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            heroBanner: {
                              ...draftPillows.heroBanner,
                              headlineHighlight: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none font-bold text-[#0A2E73]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Hero Supporting Description
                    </label>
                    <textarea
                      rows={2}
                      value={draftPillows.heroBanner.description}
                      onChange={(e) =>
                        setDraftPillows({
                          ...draftPillows,
                          heroBanner: {
                            ...draftPillows.heroBanner,
                            description: e.target.value,
                          },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[#E2E8F0]">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Right Glass Card Title
                      </label>
                      <input
                        type="text"
                        value={draftPillows.heroBanner.promiseTitle}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            heroBanner: {
                              ...draftPillows.heroBanner,
                              promiseTitle: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Right Glass Card Text
                      </label>
                      <input
                        type="text"
                        value={draftPillows.heroBanner.promiseText}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            heroBanner: {
                              ...draftPillows.heroBanner,
                              promiseText: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Right Glass Card CTA Text
                      </label>
                      <input
                        type="text"
                        value={draftPillows.heroBanner.promiseLinkText}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            heroBanner: {
                              ...draftPillows.heroBanner,
                              promiseLinkText: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Reassurance Strip & Catalogue Header */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                    <h3 className="text-base font-bold text-[#071F52]">
                      4 Reassurance Strip Badges
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {draftPillows.reassuranceItems.map((item, idx) => (
                        <div key={idx}>
                          <label className="block text-[10px] font-bold text-[#64748B] mb-1">
                            Badge #{idx + 1}
                          </label>
                          <input
                            type="text"
                            value={item}
                            onChange={(e) => {
                              const next = [...draftPillows.reassuranceItems];
                              next[idx] = e.target.value;
                              setDraftPillows({
                                ...draftPillows,
                                reassuranceItems: next,
                              });
                            }}
                            className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none font-semibold"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                    <h3 className="text-base font-bold text-[#071F52]">
                      Pillow Catalogue Section Heading
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Eyebrow Label
                        </label>
                        <input
                          type="text"
                          value={draftPillows.catalogueHeader.eyebrow}
                          onChange={(e) =>
                            setDraftPillows({
                              ...draftPillows,
                              catalogueHeader: {
                                ...draftPillows.catalogueHeader,
                                eyebrow: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Section Title
                        </label>
                        <input
                          type="text"
                          value={draftPillows.catalogueHeader.title}
                          onChange={(e) =>
                            setDraftPillows({
                              ...draftPillows,
                              catalogueHeader: {
                                ...draftPillows.catalogueHeader,
                                title: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none font-bold"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Section Subtitle
                      </label>
                      <input
                        type="text"
                        value={draftPillows.catalogueHeader.subtitle}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            catalogueHeader: {
                              ...draftPillows.catalogueHeader,
                              subtitle: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 3-Card Sleeper Posture Selection Guide */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-bold text-[#071F52]">
                    &ldquo;How to Choose the Right Pillow for Your Sleep Position&rdquo; Guide (3 Posture Cards)
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Guide Eyebrow
                      </label>
                      <input
                        type="text"
                        value={draftPillows.postureGuide.eyebrow}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            postureGuide: {
                              ...draftPillows.postureGuide,
                              eyebrow: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Guide Main Heading
                      </label>
                      <input
                        type="text"
                        value={draftPillows.postureGuide.title}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            postureGuide: {
                              ...draftPillows.postureGuide,
                              title: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none font-bold"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Bottom CTA Button Text
                      </label>
                      <input
                        type="text"
                        value={draftPillows.postureGuide.ctaText}
                        onChange={(e) =>
                          setDraftPillows({
                            ...draftPillows,
                            postureGuide: {
                              ...draftPillows.postureGuide,
                              ctaText: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    {draftPillows.postureGuide.cards.map((card, cIdx) => (
                      <div
                        key={cIdx}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-[#E3262E]">
                            Posture Card #{cIdx + 1}
                          </span>
                          <input
                            type="text"
                            value={card.number}
                            onChange={(e) => {
                              const nextCards = [...draftPillows.postureGuide.cards];
                              nextCards[cIdx] = {
                                ...nextCards[cIdx],
                                number: e.target.value,
                              };
                              setDraftPillows({
                                ...draftPillows,
                                postureGuide: {
                                  ...draftPillows.postureGuide,
                                  cards: nextCards,
                                },
                              });
                            }}
                            className="w-14 px-2 py-1 rounded-lg border border-[#E2E8F0] bg-white text-center font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                            Sleeper Type Title
                          </label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) => {
                              const nextCards = [...draftPillows.postureGuide.cards];
                              nextCards[cIdx] = {
                                ...nextCards[cIdx],
                                title: e.target.value,
                              };
                              setDraftPillows({
                                ...draftPillows,
                                postureGuide: {
                                  ...draftPillows.postureGuide,
                                  cards: nextCards,
                                },
                              });
                            }}
                            className="w-full min-h-[38px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white font-bold outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                            Posture Advice Description
                          </label>
                          <textarea
                            rows={3}
                            value={card.description}
                            onChange={(e) => {
                              const nextCards = [...draftPillows.postureGuide.cards];
                              nextCards[cIdx] = {
                                ...nextCards[cIdx],
                                description: e.target.value,
                              };
                              setDraftPillows({
                                ...draftPillows,
                                postureGuide: {
                                  ...draftPillows.postureGuide,
                                  cards: nextCards,
                                },
                              });
                            }}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] bg-white outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                            Best Match Recommendation Line
                          </label>
                          <input
                            type="text"
                            value={card.bestMatch}
                            onChange={(e) => {
                              const nextCards = [...draftPillows.postureGuide.cards];
                              nextCards[cIdx] = {
                                ...nextCards[cIdx],
                                bestMatch: e.target.value,
                              };
                              setDraftPillows({
                                ...draftPillows,
                                postureGuide: {
                                  ...draftPillows.postureGuide,
                                  cards: nextCards,
                                },
                              });
                            }}
                            className="w-full min-h-[38px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white font-semibold text-[#0A2E73] outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* SUB-TAB 3: NAVBAR "PILLOWS" DROPDOWN MENU LINKS               */}
            {/* ------------------------------------------------------------- */}
            {pilSubTab === 'dropdown' && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Navbar &ldquo;Pillows&rdquo; Dropdown Links (Desktop &amp; Mobile Navigation)
                    </h3>
                    <p className="text-[#64748B] mt-0.5">
                      Edit, reorder, or add links inside the top navigation bar&apos;s &ldquo;Pillows&rdquo; dropdown menu.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftPillows({
                        ...draftPillows,
                        dropdownLinks: [
                          ...draftPillows.dropdownLinks,
                          {
                            label: 'New Pillow Link',
                            href: '/pillows',
                          },
                        ],
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Dropdown Link</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {draftPillows.dropdownLinks.map((lnk, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-3"
                    >
                      <span className="px-2.5 py-1 rounded-lg bg-[#0A2E73]/10 text-[#0A2E73] font-mono font-bold">
                        #{idx + 1}
                      </span>
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                          Dropdown Item Label
                        </label>
                        <input
                          type="text"
                          value={lnk.label}
                          onChange={(e) => {
                            const next = [...draftPillows.dropdownLinks];
                            next[idx] = { ...next[idx], label: e.target.value };
                            setDraftPillows({ ...draftPillows, dropdownLinks: next });
                          }}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-[#071F52] outline-none"
                        />
                      </div>
                      <div className="flex-1 w-full">
                        <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                          Target Route / URL (e.g. /pillows)
                        </label>
                        <input
                          type="text"
                          value={lnk.href}
                          onChange={(e) => {
                            const next = [...draftPillows.dropdownLinks];
                            next[idx] = { ...next[idx], href: e.target.value };
                            setDraftPillows({ ...draftPillows, dropdownLinks: next });
                          }}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-mono outline-none"
                        />
                      </div>
                      {draftPillows.dropdownLinks.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setDraftPillows({
                              ...draftPillows,
                              dropdownLinks: draftPillows.dropdownLinks.filter(
                                (_, i) => i !== idx
                              ),
                            })
                          }
                          className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer mt-4 sm:mt-0"
                          title="Delete Dropdown Link"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2.5: COMPLETE FOOTER VISUAL EDITOR                          */}
        {/* =============================================================== */}
        {activeTab === 'footer' && (
          <div className="space-y-6">
            {/* Top Action Bar for Footer CMS */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#E3262E] shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-[#071F52]">
                    Footer Complete Visual Editor
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Edit every section of the Storefront Footer — 4 Brand Promise Badges, Newsletter Club Box, Brand Logo &amp; Certifications, Social Media Links, 3 Navigation Link Columns, Concierge &amp; Showrooms Card, Payment Methods &amp; Legal Links.
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleResetCompleteFooter}
                  disabled={isSavingFooter}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-rose-50 text-[#475569] hover:text-rose-700 border border-[#E2E8F0] text-xs font-semibold flex items-center gap-2 whitespace-nowrap cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveCompleteFooter}
                  disabled={isSavingFooter}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E3262E] hover:bg-[#C8161D] active:scale-98 text-white text-xs font-bold flex items-center gap-2 whitespace-nowrap cursor-pointer shadow-[0_8px_20px_rgba(227,38,46,0.28)] transition-all"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>{isSavingFooter ? 'Saving Footer...' : 'Save Footer'}</span>
                </button>
              </div>
            </div>

            {/* Sub-Section Switcher Pills inside Footer Editor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'promises-newsletter' as const,
                  label: '1. Promise Badges (4) & Newsletter Box',
                },
                {
                  id: 'brand-socials' as const,
                  label: '2. Brand Logo, Description, Certifications & Socials',
                },
                {
                  id: 'nav-columns' as const,
                  label: '3. Navigation Link Columns (3 Groups)',
                },
                {
                  id: 'concierge-legal' as const,
                  label: '4. Concierge, Showrooms, Payments & Legal Bar',
                },
              ].map((sub) => (
                <button
                  key={sub.id}
                  type="button"
                  onClick={() => setFooterSubTab(sub.id)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold text-left cursor-pointer transition-all ${
                    footerSubTab === sub.id
                      ? 'bg-[#071F52] text-white shadow-xs'
                      : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 1: TOP PROMISE BADGES (4) & NEWSLETTER BOX          */}
            {/* ----------------------------------------------------------- */}
            {footerSubTab === 'promises-newsletter' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: 4 Brand Promise Badges */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                        Top Footer Strip
                      </span>
                      <h3 className="text-base font-bold text-[#071F52]">
                        4 Brand Promise Badges
                      </h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {draftFooter.promiseBadges.map((badge, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
                      >
                        <div className="text-[10px] font-mono font-bold text-[#0A2E73] uppercase">
                          Promise Badge #{idx + 1}
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                            Badge Title
                          </label>
                          <input
                            type="text"
                            value={badge.title}
                            onChange={(e) => {
                              const next = [...draftFooter.promiseBadges];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setDraftFooter({ ...draftFooter, promiseBadges: next });
                            }}
                            className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-[#071F52] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                            Badge Subtitle
                          </label>
                          <input
                            type="text"
                            value={badge.sub}
                            onChange={(e) => {
                              const next = [...draftFooter.promiseBadges];
                              next[idx] = { ...next[idx], sub: e.target.value };
                              setDraftFooter({ ...draftFooter, promiseBadges: next });
                            }}
                            className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white text-[#475569] outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Newsletter Subscription Box */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Newsletter Subscription Box
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      &ldquo;Join the Mindfree Sleep Club&rdquo; Card
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Newsletter Heading
                      </label>
                      <input
                        type="text"
                        value={draftFooter.newsletter.heading}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            newsletter: {
                              ...draftFooter.newsletter,
                              heading: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Supporting Subtext
                      </label>
                      <input
                        type="text"
                        value={draftFooter.newsletter.subtext}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            newsletter: {
                              ...draftFooter.newsletter,
                              subtext: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Input Placeholder
                        </label>
                        <input
                          type="text"
                          value={draftFooter.newsletter.placeholder}
                          onChange={(e) =>
                            setDraftFooter({
                              ...draftFooter,
                              newsletter: {
                                ...draftFooter.newsletter,
                                placeholder: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Submit Button Text
                        </label>
                        <input
                          type="text"
                          value={draftFooter.newsletter.buttonText}
                          onChange={(e) =>
                            setDraftFooter({
                              ...draftFooter,
                              newsletter: {
                                ...draftFooter.newsletter,
                                buttonText: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Confirmation Message (After Subscribing)
                      </label>
                      <input
                        type="text"
                        value={draftFooter.newsletter.successMessage}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            newsletter: {
                              ...draftFooter.newsletter,
                              successMessage: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 2: BRAND IDENTITY, LOGO, CERTIFICATIONS & SOCIALS   */}
            {/* ----------------------------------------------------------- */}
            {footerSubTab === 'brand-socials' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: Brand Logo, Description & Certifications */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Footer Column 1
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Brand Logo, Description &amp; Certification Pills
                    </h3>
                  </div>

                  {/* Logo Preview + Upload */}
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-white px-4 py-2 rounded-xl border border-[#E2E8F0] shadow-2xs">
                        <img
                          src={draftFooter.brand.logoUrl}
                          alt="Footer Logo Preview"
                          className="h-10 w-auto object-contain"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-[#071F52]">Footer Brand Logo</div>
                        <div className="text-[11px] text-[#64748B] font-mono truncate max-w-[220px]">
                          {draftFooter.brand.logoUrl?.startsWith('data:image/')
                            ? '✓ Custom Uploaded Logo Active'
                            : draftFooter.brand.logoUrl}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        handleHomeImageUpload(
                          'media-uploads',
                          'footer-brand-logo',
                          'Mindfree Footer Logo',
                          (url) =>
                            setDraftFooter({
                              ...draftFooter,
                              brand: { ...draftFooter.brand, logoUrl: url },
                            })
                        )
                      }
                      className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {uploadingFieldKey === 'footer-brand-logo'
                          ? 'Uploading...'
                          : 'Upload Logo'}
                      </span>
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Logo Image URL
                    </label>
                    <input
                      type="text"
                      value={formatImageInputValue(draftFooter.brand.logoUrl)}
                      placeholder={getImageInputPlaceholder(draftFooter.brand.logoUrl)}
                      onChange={(e) =>
                        setDraftFooter({
                          ...draftFooter,
                          brand: { ...draftFooter.brand, logoUrl: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Brand Summary Paragraph
                    </label>
                    <textarea
                      rows={3}
                      value={draftFooter.brand.description}
                      onChange={(e) =>
                        setDraftFooter({
                          ...draftFooter,
                          brand: { ...draftFooter.brand, description: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>

                  {/* Certifications List */}
                  <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#071F52]">
                        Certification Badges ({draftFooter.brand.certifications.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftFooter({
                            ...draftFooter,
                            brand: {
                              ...draftFooter.brand,
                              certifications: [
                                ...draftFooter.brand.certifications,
                                'New Certification',
                              ],
                            },
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0A2E73] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Badge</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {draftFooter.brand.certifications.map((cert, cIdx) => (
                        <div key={cIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={cert}
                            onChange={(e) => {
                              const next = [...draftFooter.brand.certifications];
                              next[cIdx] = e.target.value;
                              setDraftFooter({
                                ...draftFooter,
                                brand: { ...draftFooter.brand, certifications: next },
                              });
                            }}
                            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-semibold outline-none"
                          />
                          {draftFooter.brand.certifications.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftFooter({
                                  ...draftFooter,
                                  brand: {
                                    ...draftFooter.brand,
                                    certifications: draftFooter.brand.certifications.filter(
                                      (_, i) => i !== cIdx
                                    ),
                                  },
                                })
                              }
                              className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right: Social Media Links */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                        Social Profiles
                      </span>
                      <h3 className="text-base font-bold text-[#071F52]">
                        &ldquo;Connect With Us&rdquo; Social Media Links
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftFooter({
                          ...draftFooter,
                          brand: {
                            ...draftFooter.brand,
                            socials: [
                              ...draftFooter.brand.socials,
                              { label: 'Instagram', href: 'https://instagram.com' },
                            ],
                          },
                        })
                      }
                      className="px-3 py-1.5 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Social</span>
                    </button>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Social Section Heading
                    </label>
                    <input
                      type="text"
                      value={draftFooter.brand.socialHeading}
                      onChange={(e) =>
                        setDraftFooter({
                          ...draftFooter,
                          brand: { ...draftFooter.brand, socialHeading: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                    />
                  </div>

                  <div className="space-y-2.5">
                    {draftFooter.brand.socials.map((soc, sIdx) => (
                      <div
                        key={sIdx}
                        className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex flex-col sm:flex-row items-center gap-2.5"
                      >
                        <input
                          type="text"
                          value={soc.label}
                          onChange={(e) => {
                            const next = [...draftFooter.brand.socials];
                            next[sIdx] = { ...next[sIdx], label: e.target.value };
                            setDraftFooter({
                              ...draftFooter,
                              brand: { ...draftFooter.brand, socials: next },
                            });
                          }}
                          placeholder="Platform (e.g. Instagram)"
                          className="w-full sm:w-36 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-[#071F52] outline-none"
                        />
                        <input
                          type="text"
                          value={soc.href}
                          onChange={(e) => {
                            const next = [...draftFooter.brand.socials];
                            next[sIdx] = { ...next[sIdx], href: e.target.value };
                            setDraftFooter({
                              ...draftFooter,
                              brand: { ...draftFooter.brand, socials: next },
                            });
                          }}
                          placeholder="https://..."
                          className="flex-1 w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-mono outline-none"
                        />
                        {draftFooter.brand.socials.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraftFooter({
                                ...draftFooter,
                                brand: {
                                  ...draftFooter.brand,
                                  socials: draftFooter.brand.socials.filter(
                                    (_, i) => i !== sIdx
                                  ),
                                },
                              })
                            }
                            className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 3: NAVIGATION LINK COLUMNS (3 GROUPS & ALL LINKS)   */}
            {/* ----------------------------------------------------------- */}
            {footerSubTab === 'nav-columns' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
                {draftFooter.navGroups.map((group, gIdx) => (
                  <div
                    key={group.id || gIdx}
                    className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                        <div>
                          <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                            Navigation Column #{gIdx + 1}
                          </span>
                          <h3 className="text-sm font-bold text-[#071F52]">{group.title}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextGroups = [...draftFooter.navGroups];
                            nextGroups[gIdx] = {
                              ...nextGroups[gIdx],
                              links: [
                                ...nextGroups[gIdx].links,
                                { name: 'New Footer Link', action: 'home' },
                              ],
                            };
                            setDraftFooter({ ...draftFooter, navGroups: nextGroups });
                          }}
                          className="px-3 py-1.5 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Link</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-wider text-[#64748B] mb-1">
                          Column Heading Title
                        </label>
                        <input
                          type="text"
                          value={group.title}
                          onChange={(e) => {
                            const nextGroups = [...draftFooter.navGroups];
                            nextGroups[gIdx] = { ...nextGroups[gIdx], title: e.target.value };
                            setDraftFooter({ ...draftFooter, navGroups: nextGroups });
                          }}
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                        />
                      </div>

                      <div className="space-y-2.5">
                        {group.links.map((lnk, lIdx) => (
                          <div
                            key={lIdx}
                            className="p-3 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-mono font-bold text-[#0A2E73]">
                                Link #{lIdx + 1}
                              </span>
                              {group.links.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    const nextGroups = [...draftFooter.navGroups];
                                    nextGroups[gIdx] = {
                                      ...nextGroups[gIdx],
                                      links: nextGroups[gIdx].links.filter((_, i) => i !== lIdx),
                                    };
                                    setDraftFooter({ ...draftFooter, navGroups: nextGroups });
                                  }}
                                  className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                                  title="Delete Link"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>

                            <div>
                              <label className="block text-[10px] text-[#64748B] mb-0.5">
                                Link Label
                              </label>
                              <input
                                type="text"
                                value={lnk.name}
                                onChange={(e) => {
                                  const nextGroups = [...draftFooter.navGroups];
                                  const nextLinks = [...nextGroups[gIdx].links];
                                  nextLinks[lIdx] = { ...nextLinks[lIdx], name: e.target.value };
                                  nextGroups[gIdx] = { ...nextGroups[gIdx], links: nextLinks };
                                  setDraftFooter({ ...draftFooter, navGroups: nextGroups });
                                }}
                                className="w-full min-h-[36px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white font-semibold text-[#071F52] outline-none"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-[#64748B] mb-0.5">
                                  Action / Route
                                </label>
                                <input
                                  type="text"
                                  value={lnk.action}
                                  onChange={(e) => {
                                    const nextGroups = [...draftFooter.navGroups];
                                    const nextLinks = [...nextGroups[gIdx].links];
                                    nextLinks[lIdx] = {
                                      ...nextLinks[lIdx],
                                      action: e.target.value,
                                    };
                                    nextGroups[gIdx] = { ...nextGroups[gIdx], links: nextLinks };
                                    setDraftFooter({ ...draftFooter, navGroups: nextGroups });
                                  }}
                                  className="w-full min-h-[34px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white font-mono text-[11px] outline-none"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-[#64748B] mb-0.5">
                                  Badge (Optional)
                                </label>
                                <input
                                  type="text"
                                  placeholder="e.g. Popular, New"
                                  value={lnk.badge || ''}
                                  onChange={(e) => {
                                    const nextGroups = [...draftFooter.navGroups];
                                    const nextLinks = [...nextGroups[gIdx].links];
                                    nextLinks[lIdx] = {
                                      ...nextLinks[lIdx],
                                      badge: e.target.value || undefined,
                                    };
                                    nextGroups[gIdx] = { ...nextGroups[gIdx], links: nextLinks };
                                    setDraftFooter({ ...draftFooter, navGroups: nextGroups });
                                  }}
                                  className="w-full min-h-[34px] px-2.5 py-1 rounded-lg border border-[#E2E8F0] bg-white text-[11px] outline-none"
                                />
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 4: CONCIERGE, SHOWROOMS, PAYMENTS & LEGAL BAR       */}
            {/* ----------------------------------------------------------- */}
            {footerSubTab === 'concierge-legal' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: Concierge & Showrooms Card (Column 5) */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Footer Column 5
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Concierge &amp; Showrooms Contact Card
                    </h3>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Column Heading
                    </label>
                    <input
                      type="text"
                      value={draftFooter.concierge.heading}
                      onChange={(e) =>
                        setDraftFooter({
                          ...draftFooter,
                          concierge: { ...draftFooter.concierge, heading: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Displayed Phone Number
                      </label>
                      <input
                        type="text"
                        value={draftFooter.concierge.phoneDisplay}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            concierge: { ...draftFooter.concierge, phoneDisplay: e.target.value },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Dialable Phone Link (tel:)
                      </label>
                      <input
                        type="text"
                        value={draftFooter.concierge.phoneHref}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            concierge: { ...draftFooter.concierge, phoneHref: e.target.value },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Support Hours Subtitle
                    </label>
                    <input
                      type="text"
                      value={draftFooter.concierge.phoneHours}
                      onChange={(e) =>
                        setDraftFooter({
                          ...draftFooter,
                          concierge: { ...draftFooter.concierge, phoneHours: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Concierge Email Address
                      </label>
                      <input
                        type="text"
                        value={draftFooter.concierge.emailDisplay}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            concierge: { ...draftFooter.concierge, emailDisplay: e.target.value },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Email Subtitle
                      </label>
                      <input
                        type="text"
                        value={draftFooter.concierge.emailSubtext}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            concierge: { ...draftFooter.concierge, emailSubtext: e.target.value },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Showrooms Card Title
                      </label>
                      <input
                        type="text"
                        value={draftFooter.concierge.showroomsTitle}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            concierge: {
                              ...draftFooter.concierge,
                              showroomsTitle: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Showroom Cities Line
                      </label>
                      <input
                        type="text"
                        value={draftFooter.concierge.showroomsLocations}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            concierge: {
                              ...draftFooter.concierge,
                              showroomsLocations: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Right: Bottom Copyright, Payment Methods & Legal Links */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-5 min-w-0">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Bottom Footer Bar
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Copyright, Payment Badges &amp; Legal Links
                    </h3>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Highlighted Brand Name
                      </label>
                      <input
                        type="text"
                        value={draftFooter.bottomBar.copyrightBrand}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            bottomBar: {
                              ...draftFooter.bottomBar,
                              copyrightBrand: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Copyright Suffix Text
                      </label>
                      <input
                        type="text"
                        value={draftFooter.bottomBar.copyrightSuffix}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            bottomBar: {
                              ...draftFooter.bottomBar,
                              copyrightSuffix: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Badges */}
                  <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#071F52]">
                        Accepted Payment Badges ({draftFooter.bottomBar.paymentMethods.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftFooter({
                            ...draftFooter,
                            bottomBar: {
                              ...draftFooter.bottomBar,
                              paymentMethods: [
                                ...draftFooter.bottomBar.paymentMethods,
                                'New Payment',
                              ],
                            },
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0A2E73] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Payment Badge</span>
                      </button>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                        Payment Strip Prefix Label
                      </label>
                      <input
                        type="text"
                        value={draftFooter.bottomBar.paymentLabel}
                        onChange={(e) =>
                          setDraftFooter({
                            ...draftFooter,
                            bottomBar: {
                              ...draftFooter.bottomBar,
                              paymentLabel: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {draftFooter.bottomBar.paymentMethods.map((pay, pIdx) => (
                        <div
                          key={pIdx}
                          className="flex items-center gap-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl px-2.5 py-1"
                        >
                          <input
                            type="text"
                            value={pay}
                            onChange={(e) => {
                              const next = [...draftFooter.bottomBar.paymentMethods];
                              next[pIdx] = e.target.value;
                              setDraftFooter({
                                ...draftFooter,
                                bottomBar: {
                                  ...draftFooter.bottomBar,
                                  paymentMethods: next,
                                },
                              });
                            }}
                            className="w-24 bg-white px-2 py-1 rounded-lg border border-[#E2E8F0] font-semibold text-[#071F52] outline-none"
                          />
                          {draftFooter.bottomBar.paymentMethods.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftFooter({
                                  ...draftFooter,
                                  bottomBar: {
                                    ...draftFooter.bottomBar,
                                    paymentMethods:
                                      draftFooter.bottomBar.paymentMethods.filter(
                                        (_, i) => i !== pIdx
                                      ),
                                  },
                                })
                              }
                              className="text-rose-600 hover:text-rose-700 cursor-pointer"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Legal Links */}
                  <div className="space-y-2.5 pt-2 border-t border-[#E2E8F0]">
                    <div className="flex items-center justify-between">
                      <label className="font-bold text-[#071F52]">
                        Bottom Legal Links ({draftFooter.bottomBar.legalLinks.length})
                      </label>
                      <button
                        type="button"
                        onClick={() =>
                          setDraftFooter({
                            ...draftFooter,
                            bottomBar: {
                              ...draftFooter.bottomBar,
                              legalLinks: [
                                ...draftFooter.bottomBar.legalLinks,
                                { label: 'New Legal Link', action: 'contact' },
                              ],
                            },
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#0A2E73] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add Legal Link</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {draftFooter.bottomBar.legalLinks.map((lnk, lIdx) => (
                        <div key={lIdx} className="flex items-center gap-2">
                          <input
                            type="text"
                            value={lnk.label}
                            onChange={(e) => {
                              const next = [...draftFooter.bottomBar.legalLinks];
                              next[lIdx] = { ...next[lIdx], label: e.target.value };
                              setDraftFooter({
                                ...draftFooter,
                                bottomBar: { ...draftFooter.bottomBar, legalLinks: next },
                              });
                            }}
                            placeholder="Label (e.g. Privacy Policy)"
                            className="flex-1 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-semibold outline-none"
                          />
                          <input
                            type="text"
                            value={lnk.action}
                            onChange={(e) => {
                              const next = [...draftFooter.bottomBar.legalLinks];
                              next[lIdx] = { ...next[lIdx], action: e.target.value };
                              setDraftFooter({
                                ...draftFooter,
                                bottomBar: { ...draftFooter.bottomBar, legalLinks: next },
                              });
                            }}
                            placeholder="Action (e.g. contact)"
                            className="w-36 min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono outline-none"
                          />
                          {draftFooter.bottomBar.legalLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftFooter({
                                  ...draftFooter,
                                  bottomBar: {
                                    ...draftFooter.bottomBar,
                                    legalLinks: draftFooter.bottomBar.legalLinks.filter(
                                      (_, i) => i !== lIdx
                                    ),
                                  },
                                })
                              }
                              className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2.6: COMPLETE CONTACT US PAGE VISUAL EDITOR                 */}
        {/* =============================================================== */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            {/* Top Action Bar for Contact Us CMS */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5 text-[#E3262E] shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-[#071F52]">
                    Contact Us Complete Visual Editor
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Edit every section of the Contact Us page — Hero Banner, 4 Reassurance Badges, Direct Concierge Channels (Phone, WhatsApp, Email, HQ, Order Tracking Card), Inquiry Form &amp; Customer Inquiries Inbox.
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await resetContactData();
                    showToast(
                      ok
                        ? 'Contact Us page reset to default & synced!'
                        : 'Contact Us page reset locally!'
                    );
                  }}
                  disabled={isSavingContact}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = await saveContactData(draftContact);
                    if (ok) {
                      const rows = await fetchSiteContentFromPg();
                      setSiteContents(rows);
                    }
                    showToast(
                      ok
                        ? 'Contact Us changes saved & published live!'
                        : 'Contact Us changes saved locally (Instant Live Update)!'
                    );
                  }}
                  disabled={isSavingContact}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E3262E] hover:bg-[#C81E25] text-white text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>
                    {isSavingContact ? 'Saving Contact Us...' : 'Save & Publish Contact Us'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sub-Navigation Pills for Contact Us Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'hero-reassurance' as const,
                  label: '1. Hero Banner & 4 Reassurance Badges',
                },
                {
                  id: 'channels' as const,
                  label: '2. Direct Concierge Channels (Phone, WhatsApp, Email, HQ & Tracking)',
                },
                {
                  id: 'inquiry-form' as const,
                  label: `3. Inquiry Form & Subjects (${draftContact.formConfig.subjectOptions.length})`,
                },
                {
                  id: 'inquiries-inbox' as const,
                  label: `4. Customer Inquiries Inbox (${inquiriesList.length})`,
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setContactSubTab(st.id)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                    contactSubTab === st.id
                      ? 'bg-[#071F52] text-white shadow-xs'
                      : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 1: HERO BANNER & 4 REASSURANCE STRIP ITEMS          */}
            {/* ----------------------------------------------------------- */}
            {contactSubTab === 'hero-reassurance' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: Hero Banner Editor */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Top Dark-Blue Banner
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Contact Us Hero Banner Content
                    </h3>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Top Pill Badge Text
                    </label>
                    <input
                      type="text"
                      value={draftContact.hero.badge}
                      onChange={(e) =>
                        setDraftContact({
                          ...draftContact,
                          hero: { ...draftContact.hero, badge: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Main Headline (Part 1)
                      </label>
                      <input
                        type="text"
                        value={draftContact.hero.headlineMain}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            hero: { ...draftContact.hero, headlineMain: e.target.value },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Main Headline (Part 2)
                      </label>
                      <input
                        type="text"
                        value={draftContact.hero.headlineHighlight}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            hero: { ...draftContact.hero, headlineHighlight: e.target.value },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Hero Supporting Description
                    </label>
                    <textarea
                      rows={3}
                      value={draftContact.hero.description}
                      onChange={(e) =>
                        setDraftContact({
                          ...draftContact,
                          hero: { ...draftContact.hero, description: e.target.value },
                        })
                      }
                      className="w-full p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>

                  {/* Live Hero Preview */}
                  <div className="p-5 rounded-2xl bg-[#0A2E73] text-white space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold uppercase tracking-wider text-white">
                      <Phone className="w-3 h-3 text-white" />
                      <span>{draftContact.hero.badge}</span>
                    </div>
                    <div className="text-lg font-bold text-white leading-snug">
                      {draftContact.hero.headlineMain}{' '}
                      <span className="font-bold text-white">
                        {draftContact.hero.headlineHighlight}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed">
                      {draftContact.hero.description}
                    </p>
                  </div>
                </div>

                {/* Right: 4 Reassurance Strip Badges */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      4-Column Trust Bar
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Reassurance Strip Badges (4 Items)
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {draftContact.reassuranceItems.map((item, idx) => (
                      <div key={idx}>
                        <label className="block text-[11px] font-semibold text-[#64748B] mb-1">
                          Reassurance Badge #{idx + 1}
                        </label>
                        <input
                          type="text"
                          value={item}
                          onChange={(e) => {
                            const next = [...draftContact.reassuranceItems];
                            next[idx] = e.target.value;
                            setDraftContact({ ...draftContact, reassuranceItems: next });
                          }}
                          className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-semibold text-[#071F52] outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 2: DIRECT CONCIERGE CHANNELS                        */}
            {/* ----------------------------------------------------------- */}
            {contactSubTab === 'channels' && (
              <div className="space-y-6 text-xs">
                {/* Section Header */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Left Column Heading
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Direct Channels Section Header
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Eyebrow Tag
                      </label>
                      <input
                        type="text"
                        value={draftContact.channelsHeader.eyebrow}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            channelsHeader: {
                              ...draftContact.channelsHeader,
                              eyebrow: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Section Title
                      </label>
                      <input
                        type="text"
                        value={draftContact.channelsHeader.title}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            channelsHeader: {
                              ...draftContact.channelsHeader,
                              title: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Section Subtitle
                      </label>
                      <input
                        type="text"
                        value={draftContact.channelsHeader.subtitle}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            channelsHeader: {
                              ...draftContact.channelsHeader,
                              subtitle: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* 5 Channel Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Phone */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-[#071F52] border-b border-[#E2E8F0] pb-2">
                      1. Direct Telephone Helpline Card
                    </h4>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">Card Title</label>
                      <input
                        type="text"
                        value={draftContact.phoneCard.title}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            phoneCard: { ...draftContact.phoneCard, title: e.target.value },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Displayed Phone Number
                        </label>
                        <input
                          type="text"
                          value={draftContact.phoneCard.phoneDisplay}
                          onChange={(e) =>
                            setDraftContact({
                              ...draftContact,
                              phoneCard: {
                                ...draftContact.phoneCard,
                                phoneDisplay: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Dialable Tel Number
                        </label>
                        <input
                          type="text"
                          value={draftContact.phoneCard.phoneHref}
                          onChange={(e) =>
                            setDraftContact({
                              ...draftContact,
                              phoneCard: { ...draftContact.phoneCard, phoneHref: e.target.value },
                            })
                          }
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Operating Hours Subtitle
                      </label>
                      <input
                        type="text"
                        value={draftContact.phoneCard.hoursText}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            phoneCard: { ...draftContact.phoneCard, hoursText: e.target.value },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  {/* Card 2: WhatsApp */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-[#071F52] border-b border-[#E2E8F0] pb-2">
                      2. WhatsApp Live Chat Card
                    </h4>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">Card Title</label>
                      <input
                        type="text"
                        value={draftContact.whatsappCard.title}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            whatsappCard: { ...draftContact.whatsappCard, title: e.target.value },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Displayed WhatsApp Number
                        </label>
                        <input
                          type="text"
                          value={draftContact.whatsappCard.numberDisplay}
                          onChange={(e) =>
                            setDraftContact({
                              ...draftContact,
                              whatsappCard: {
                                ...draftContact.whatsappCard,
                                numberDisplay: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          WhatsApp Link URL
                        </label>
                        <input
                          type="text"
                          value={draftContact.whatsappCard.whatsappUrl}
                          onChange={(e) =>
                            setDraftContact({
                              ...draftContact,
                              whatsappCard: {
                                ...draftContact.whatsappCard,
                                whatsappUrl: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Subtitle Description
                      </label>
                      <input
                        type="text"
                        value={draftContact.whatsappCard.subtitle}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            whatsappCard: {
                              ...draftContact.whatsappCard,
                              subtitle: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  {/* Card 3: Email */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-[#071F52] border-b border-[#E2E8F0] pb-2">
                      3. Atelier Electronic Mail Card
                    </h4>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">Card Title</label>
                      <input
                        type="text"
                        value={draftContact.emailCard.title}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            emailCard: { ...draftContact.emailCard, title: e.target.value },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Email Address (mailto:)
                      </label>
                      <input
                        type="text"
                        value={draftContact.emailCard.emailDisplay}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            emailCard: { ...draftContact.emailCard, emailDisplay: e.target.value },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Response Time Subtitle
                      </label>
                      <input
                        type="text"
                        value={draftContact.emailCard.subtitle}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            emailCard: { ...draftContact.emailCard, subtitle: e.target.value },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  {/* Card 4: Corporate Headquarters */}
                  <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-[#071F52] border-b border-[#E2E8F0] pb-2">
                      4. Corporate Headquarters Card
                    </h4>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">Card Title</label>
                      <input
                        type="text"
                        value={draftContact.headquartersCard.title}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            headquartersCard: {
                              ...draftContact.headquartersCard,
                              title: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Full Street Address
                      </label>
                      <textarea
                        rows={3}
                        value={draftContact.headquartersCard.address}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            headquartersCard: {
                              ...draftContact.headquartersCard,
                              address: e.target.value,
                            },
                          })
                        }
                        className="w-full p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>

                  {/* Card 5: Order Tracking Shortcut */}
                  <div className="md:col-span-2 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3">
                    <h4 className="text-sm font-bold text-[#071F52] border-b border-[#E2E8F0] pb-2">
                      5. Live Order Tracking Shortcut Card
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Card Title
                        </label>
                        <input
                          type="text"
                          value={draftContact.orderTrackingCard.title}
                          onChange={(e) =>
                            setDraftContact({
                              ...draftContact,
                              orderTrackingCard: {
                                ...draftContact.orderTrackingCard,
                                title: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          CTA Button Label
                        </label>
                        <input
                          type="text"
                          value={draftContact.orderTrackingCard.buttonText}
                          onChange={(e) =>
                            setDraftContact({
                              ...draftContact,
                              orderTrackingCard: {
                                ...draftContact.orderTrackingCard,
                                buttonText: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[#0F2952] mb-1">
                          Supporting Description
                        </label>
                        <input
                          type="text"
                          value={draftContact.orderTrackingCard.description}
                          onChange={(e) =>
                            setDraftContact({
                              ...draftContact,
                              orderTrackingCard: {
                                ...draftContact.orderTrackingCard,
                                description: e.target.value,
                              },
                            })
                          }
                          className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 3: INQUIRY FORM CONFIG & DROPDOWN SUBJECTS          */}
            {/* ----------------------------------------------------------- */}
            {contactSubTab === 'inquiry-form' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: Form Headings, Button & Confirmation */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Right Column Form
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Concierge Inquiry Form Headings &amp; Labels
                    </h3>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Form Eyebrow Tag
                    </label>
                    <input
                      type="text"
                      value={draftContact.formConfig.eyebrow}
                      onChange={(e) =>
                        setDraftContact({
                          ...draftContact,
                          formConfig: { ...draftContact.formConfig, eyebrow: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Form Main Title
                    </label>
                    <input
                      type="text"
                      value={draftContact.formConfig.title}
                      onChange={(e) =>
                        setDraftContact({
                          ...draftContact,
                          formConfig: { ...draftContact.formConfig, title: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Form Subtitle
                    </label>
                    <input
                      type="text"
                      value={draftContact.formConfig.subtitle}
                      onChange={(e) =>
                        setDraftContact({
                          ...draftContact,
                          formConfig: { ...draftContact.formConfig, subtitle: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Submit Button Label
                      </label>
                      <input
                        type="text"
                        value={draftContact.formConfig.submitButtonText}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            formConfig: {
                              ...draftContact.formConfig,
                              submitButtonText: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Success Confirmation Heading
                      </label>
                      <input
                        type="text"
                        value={draftContact.formConfig.confirmationTitle}
                        onChange={(e) =>
                          setDraftContact({
                            ...draftContact,
                            formConfig: {
                              ...draftContact.formConfig,
                              confirmationTitle: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Bottom Privacy Reassurance Note
                    </label>
                    <input
                      type="text"
                      value={draftContact.formConfig.privacyNote}
                      onChange={(e) =>
                        setDraftContact({
                          ...draftContact,
                          formConfig: {
                            ...draftContact.formConfig,
                            privacyNote: e.target.value,
                          },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>
                </div>

                {/* Right: Inquiry Purpose Dropdown Options */}
                <div className="lg:col-span-6 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                        Dropdown Menu Options
                      </span>
                      <h3 className="text-base font-bold text-[#071F52]">
                        Inquiry Purpose Dropdown Subjects (
                        {draftContact.formConfig.subjectOptions.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftContact({
                          ...draftContact,
                          formConfig: {
                            ...draftContact.formConfig,
                            subjectOptions: [
                              ...draftContact.formConfig.subjectOptions,
                              'New Concierge Inquiry Topic',
                            ],
                          },
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Subject Option</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {draftContact.formConfig.subjectOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#0A2E73] font-mono font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const next = [...draftContact.formConfig.subjectOptions];
                            next[idx] = e.target.value;
                            setDraftContact({
                              ...draftContact,
                              formConfig: { ...draftContact.formConfig, subjectOptions: next },
                            });
                          }}
                          className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-semibold text-[#071F52] outline-none"
                        />
                        {draftContact.formConfig.subjectOptions.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraftContact({
                                ...draftContact,
                                formConfig: {
                                  ...draftContact.formConfig,
                                  subjectOptions:
                                    draftContact.formConfig.subjectOptions.filter(
                                      (_, i) => i !== idx
                                    ),
                                },
                              })
                            }
                            className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                            title="Remove Option"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 4: CUSTOMER INQUIRIES INBOX                         */}
            {/* ----------------------------------------------------------- */}
            {contactSubTab === 'inquiries-inbox' && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Concierge Desk Submissions
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Customer Inquiries Received ({inquiriesList.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={loadCustomerInquiries}
                    className="px-4 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white text-[#0A2E73] font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-[#E3262E]" />
                    <span>Refresh Inbox</span>
                  </button>
                </div>

                {inquiriesList.length === 0 ? (
                  <div className="py-12 text-center text-[#64748B]">
                    No customer inquiries have been submitted from the Contact Us form yet.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {inquiriesList.map((inq, idx) => (
                      <div
                        key={`${inq.id}-${idx}`}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-2.5 py-0.5 rounded-full bg-[#DBEAFE] text-[#0A2E73] font-mono text-[10px] font-bold">
                            {inq.subject}
                          </span>
                          <span className="text-[10px] text-[#64748B] font-mono">
                            {new Date(inq.submittedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="font-bold text-sm text-[#071F52]">{inq.name}</div>
                        <div className="flex flex-wrap gap-3 text-[11px] text-[#475569] font-mono">
                          <span>Email: {inq.email}</span>
                          {inq.phone && <span>Phone: {inq.phone}</span>}
                        </div>
                        <p className="text-xs text-[#1E293B] bg-white p-3 rounded-xl border border-[#E2E8F0] leading-relaxed">
                          {inq.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 2.7: COMPLETE WHY MINDFREE & DROPDOWN VISUAL EDITOR         */}
        {/* =============================================================== */}
        {activeTab === 'why-mindfree' && (
          <div className="space-y-6">
            {/* Top Action Bar for Why Mindfree CMS */}
            <div className="bg-white rounded-3xl border border-[#E2E8F0] p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E3262E] shrink-0" />
                  <h2 className="text-lg sm:text-xl font-bold text-[#071F52]">
                    Why Mindfree Page &amp; Dropdown Complete Visual Editor
                  </h2>
                </div>
                <p className="text-xs text-[#64748B] mt-1">
                  Edit the &quot;Why Mindfree&quot; Navigation Dropdown links, Hero Heritage Banner, Manifesto &amp; Craftsmanship Photography, 4 Architecture Pillars, 3 Raw Material Provenance Cards &amp; Bottom CTA Banner.
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap sm:flex-nowrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={async () => {
                    const ok = await resetWhyMindfreeData();
                    showToast(
                      ok
                        ? 'Why Mindfree page & dropdown reset to defaults & synced!'
                        : 'Why Mindfree reset locally!'
                    );
                  }}
                  disabled={isSavingWhyMindfree}
                  className="min-h-[44px] px-4 py-2.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-slate-100 text-xs font-semibold text-[#475569] inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                  <span>Reset Defaults</span>
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    const ok = await saveWhyMindfreeData(draftWhyMindfree);
                    if (ok) {
                      const rows = await fetchSiteContentFromPg();
                      setSiteContents(rows);
                    }
                    showToast(
                      ok
                        ? 'Why Mindfree page & dropdown saved & published live!'
                        : 'Why Mindfree saved locally (Instant Live Update)!'
                    );
                  }}
                  disabled={isSavingWhyMindfree}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E3262E] hover:bg-[#C81E25] text-white text-xs font-bold inline-flex items-center gap-2 whitespace-nowrap shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-4 h-4 shrink-0" />
                  <span>
                    {isSavingWhyMindfree
                      ? 'Saving Why Mindfree...'
                      : 'Save & Publish Why Mindfree'}
                  </span>
                </button>
              </div>
            </div>

            {/* Sub-Navigation Pills for Why Mindfree Sections */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5">
              {[
                {
                  id: 'dropdown-hero' as const,
                  label: `1. Dropdown Menu Links (${draftWhyMindfree.dropdownLinks.length}) & Hero Banner`,
                },
                {
                  id: 'manifesto' as const,
                  label: '2. The Mindfree Manifesto & Craftsmanship Photo',
                },
                {
                  id: 'pillars' as const,
                  label: `3. Four Pillars of Architecture (${draftWhyMindfree.pillarsSection.pillars.length})`,
                },
                {
                  id: 'provenance-cta' as const,
                  label: `4. Material Provenance (${draftWhyMindfree.provenanceSection.items.length}) & Bottom CTA`,
                },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setWhySubTab(st.id)}
                  className={`min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold text-left transition-all cursor-pointer ${
                    whySubTab === st.id
                      ? 'bg-[#071F52] text-white shadow-xs'
                      : 'bg-white text-[#475569] border border-[#E2E8F0] hover:border-[#0A2E73]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 1: DROPDOWN LINKS & HERO BANNER                     */}
            {/* ----------------------------------------------------------- */}
            {whySubTab === 'dropdown-hero' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: Why Mindfree Navigation Dropdown Links */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                        Top Navbar Dropdown
                      </span>
                      <h3 className="text-base font-bold text-[#071F52]">
                        &quot;Why Mindfree&quot; Dropdown Links (
                        {draftWhyMindfree.dropdownLinks.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftWhyMindfree({
                          ...draftWhyMindfree,
                          dropdownLinks: [
                            ...draftWhyMindfree.dropdownLinks,
                            { label: 'New Philosophy Link', href: '/why-mindfree' },
                          ],
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Link</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {draftWhyMindfree.dropdownLinks.map((lnk, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#0A2E73]">
                            Dropdown Item #{idx + 1}
                          </span>
                          {draftWhyMindfree.dropdownLinks.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftWhyMindfree({
                                  ...draftWhyMindfree,
                                  dropdownLinks: draftWhyMindfree.dropdownLinks.filter(
                                    (_, i) => i !== idx
                                  ),
                                })
                              }
                              className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                              title="Remove Dropdown Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                              Link Label
                            </label>
                            <input
                              type="text"
                              value={lnk.label}
                              onChange={(e) => {
                                const next = [...draftWhyMindfree.dropdownLinks];
                                next[idx] = { ...next[idx], label: e.target.value };
                                setDraftWhyMindfree({
                                  ...draftWhyMindfree,
                                  dropdownLinks: next,
                                });
                              }}
                              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-[#071F52] outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-[#64748B] mb-0.5">
                              Target Path / Href
                            </label>
                            <input
                              type="text"
                              value={lnk.href}
                              onChange={(e) => {
                                const next = [...draftWhyMindfree.dropdownLinks];
                                next[idx] = { ...next[idx], href: e.target.value };
                                setDraftWhyMindfree({
                                  ...draftWhyMindfree,
                                  dropdownLinks: next,
                                });
                              }}
                              className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-mono outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Hero Heritage Banner */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Section 1 — Top Dark-Blue Banner
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Why Mindfree Hero Heritage Banner
                    </h3>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Top Pill Badge Text
                    </label>
                    <input
                      type="text"
                      value={draftWhyMindfree.hero.badge}
                      onChange={(e) =>
                        setDraftWhyMindfree({
                          ...draftWhyMindfree,
                          hero: { ...draftWhyMindfree.hero, badge: e.target.value },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Main Headline (Part 1)
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.hero.headlineMain}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            hero: { ...draftWhyMindfree.hero, headlineMain: e.target.value },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Main Headline (Part 2)
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.hero.headlineHighlight}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            hero: {
                              ...draftWhyMindfree.hero,
                              headlineHighlight: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Hero Supporting Description
                    </label>
                    <textarea
                      rows={3}
                      value={draftWhyMindfree.hero.description}
                      onChange={(e) =>
                        setDraftWhyMindfree({
                          ...draftWhyMindfree,
                          hero: { ...draftWhyMindfree.hero, description: e.target.value },
                        })
                      }
                      className="w-full p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>

                  {/* Live Hero Banner Preview */}
                  <div className="p-5 rounded-2xl bg-[#0A2E73] text-white text-center space-y-2">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-semibold uppercase tracking-wider text-white">
                      <Sparkles className="w-3 h-3 text-white" />
                      <span>{draftWhyMindfree.hero.badge}</span>
                    </div>
                    <div className="text-lg font-bold text-white leading-snug">
                      {draftWhyMindfree.hero.headlineMain}{' '}
                      <span className="font-bold text-white">
                        {draftWhyMindfree.hero.headlineHighlight}
                      </span>
                    </div>
                    <p className="text-[11px] text-white/80 max-w-xl mx-auto leading-relaxed">
                      {draftWhyMindfree.hero.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 2: THE MINDFREE MANIFESTO & CRAFTSMANSHIP PHOTO     */}
            {/* ----------------------------------------------------------- */}
            {whySubTab === 'manifesto' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-xs">
                {/* Left: Manifesto Editorial Content */}
                <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                        Section 2 — Left Column
                      </span>
                      <h3 className="text-base font-bold text-[#071F52]">
                        The Mindfree Manifesto Editorial
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftWhyMindfree({
                          ...draftWhyMindfree,
                          manifesto: {
                            ...draftWhyMindfree.manifesto,
                            paragraphs: [
                              ...draftWhyMindfree.manifesto.paragraphs,
                              'New manifesto paragraph detailing Mindfree craftsmanship.',
                            ],
                          },
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Paragraph</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Eyebrow Tag
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.manifesto.eyebrow}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            manifesto: {
                              ...draftWhyMindfree.manifesto,
                              eyebrow: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Section Heading
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.manifesto.title}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            manifesto: {
                              ...draftWhyMindfree.manifesto,
                              title: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    {draftWhyMindfree.manifesto.paragraphs.map((para, pIdx) => (
                      <div key={pIdx} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <label className="font-semibold text-[#0F2952]">
                            Paragraph #{pIdx + 1}
                          </label>
                          {draftWhyMindfree.manifesto.paragraphs.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftWhyMindfree({
                                  ...draftWhyMindfree,
                                  manifesto: {
                                    ...draftWhyMindfree.manifesto,
                                    paragraphs:
                                      draftWhyMindfree.manifesto.paragraphs.filter(
                                        (_, i) => i !== pIdx
                                      ),
                                  },
                                })
                              }
                              className="text-rose-600 hover:text-rose-700 inline-flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Remove</span>
                            </button>
                          )}
                        </div>
                        <textarea
                          rows={3}
                          value={para}
                          onChange={(e) => {
                            const next = [...draftWhyMindfree.manifesto.paragraphs];
                            next[pIdx] = e.target.value;
                            setDraftWhyMindfree({
                              ...draftWhyMindfree,
                              manifesto: {
                                ...draftWhyMindfree.manifesto,
                                paragraphs: next,
                              },
                            });
                          }}
                          className="w-full p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: Craftsmanship Photograph & Quote Overlay */}
                <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Section 2 — Right Column
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Craftsmanship Photograph &amp; Quote
                    </h3>
                  </div>

                  <div className="relative h-60 rounded-2xl overflow-hidden border border-[#E2E8F0] bg-[#0A2E73] flex items-center justify-center">
                    <img
                      src={draftWhyMindfree.manifesto.image}
                      alt="Manifesto Craftsmanship"
                      className="w-full h-full object-contain p-1.5"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent flex items-end p-4 pointer-events-none">
                      <p className="text-[11px] font-serif italic text-white/90">
                        {draftWhyMindfree.manifesto.imageQuote}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Photograph URL or Upload New Image
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={formatImageInputValue(draftWhyMindfree.manifesto.image)}
                        placeholder={getImageInputPlaceholder(draftWhyMindfree.manifesto.image)}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            manifesto: {
                              ...draftWhyMindfree.manifesto,
                              image: e.target.value,
                            },
                          })
                        }
                        className="flex-1 min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono outline-none"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleHomeImageUpload(
                            'media-uploads',
                            'why-manifesto-img',
                            'Why Mindfree Craftsmanship',
                            (url: string) =>
                              setDraftWhyMindfree((prev) => ({
                                ...prev,
                                manifesto: { ...prev.manifesto, image: url },
                              }))
                          )
                        }
                        className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>
                          {uploadingFieldKey === 'why-manifesto-img' ? 'Uploading...' : 'Upload'}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Bottom Image Quote Overlay
                    </label>
                    <textarea
                      rows={2}
                      value={draftWhyMindfree.manifesto.imageQuote}
                      onChange={(e) =>
                        setDraftWhyMindfree({
                          ...draftWhyMindfree,
                          manifesto: {
                            ...draftWhyMindfree.manifesto,
                            imageQuote: e.target.value,
                          },
                        })
                      }
                      className="w-full p-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 3: FOUR PILLARS OF ARCHITECTURE                     */}
            {/* ----------------------------------------------------------- */}
            {whySubTab === 'pillars' && (
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-5 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Section 3 — Guiding Standards
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      The Four Pillars of Mindfree Architecture (
                      {draftWhyMindfree.pillarsSection.pillars.length})
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftWhyMindfree({
                        ...draftWhyMindfree,
                        pillarsSection: {
                          ...draftWhyMindfree.pillarsSection,
                          pillars: [
                            ...draftWhyMindfree.pillarsSection.pillars,
                            {
                              num: String(
                                draftWhyMindfree.pillarsSection.pillars.length + 1
                              ).padStart(2, '0'),
                              title: 'New Craftsmanship Pillar',
                              desc: 'Description of this architectural sleep standard.',
                            },
                          ],
                        },
                      })
                    }
                    className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Pillar Card</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Section Eyebrow Tag
                    </label>
                    <input
                      type="text"
                      value={draftWhyMindfree.pillarsSection.eyebrow}
                      onChange={(e) =>
                        setDraftWhyMindfree({
                          ...draftWhyMindfree,
                          pillarsSection: {
                            ...draftWhyMindfree.pillarsSection,
                            eyebrow: e.target.value,
                          },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">
                      Section Main Title
                    </label>
                    <input
                      type="text"
                      value={draftWhyMindfree.pillarsSection.title}
                      onChange={(e) =>
                        setDraftWhyMindfree({
                          ...draftWhyMindfree,
                          pillarsSection: {
                            ...draftWhyMindfree.pillarsSection,
                            title: e.target.value,
                          },
                        })
                      }
                      className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {draftWhyMindfree.pillarsSection.pillars.map((pillar, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#E3262E]">
                          Pillar Card #{idx + 1}
                        </span>
                        {draftWhyMindfree.pillarsSection.pillars.length > 1 && (
                          <button
                            type="button"
                            onClick={() =>
                              setDraftWhyMindfree({
                                ...draftWhyMindfree,
                                pillarsSection: {
                                  ...draftWhyMindfree.pillarsSection,
                                  pillars: draftWhyMindfree.pillarsSection.pillars.filter(
                                    (_, i) => i !== idx
                                  ),
                                },
                              })
                            }
                            className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                            Number Badge
                          </label>
                          <input
                            type="text"
                            value={pillar.num}
                            onChange={(e) => {
                              const next = [...draftWhyMindfree.pillarsSection.pillars];
                              next[idx] = { ...next[idx], num: e.target.value };
                              setDraftWhyMindfree({
                                ...draftWhyMindfree,
                                pillarsSection: {
                                  ...draftWhyMindfree.pillarsSection,
                                  pillars: next,
                                },
                              });
                            }}
                            className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-mono font-bold text-[#E3262E] outline-none"
                          />
                        </div>
                        <div className="col-span-3">
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                            Pillar Title
                          </label>
                          <input
                            type="text"
                            value={pillar.title}
                            onChange={(e) => {
                              const next = [...draftWhyMindfree.pillarsSection.pillars];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setDraftWhyMindfree({
                                ...draftWhyMindfree,
                                pillarsSection: {
                                  ...draftWhyMindfree.pillarsSection,
                                  pillars: next,
                                },
                              });
                            }}
                            className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-[#071F52] outline-none"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                          Pillar Description
                        </label>
                        <textarea
                          rows={3}
                          value={pillar.desc}
                          onChange={(e) => {
                            const next = [...draftWhyMindfree.pillarsSection.pillars];
                            next[idx] = { ...next[idx], desc: e.target.value };
                            setDraftWhyMindfree({
                              ...draftWhyMindfree,
                              pillarsSection: {
                                ...draftWhyMindfree.pillarsSection,
                                pillars: next,
                              },
                            });
                          }}
                          className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-white outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ----------------------------------------------------------- */}
            {/* SUB-TAB 4: MATERIAL PROVENANCE & BOTTOM CTA BANNER          */}
            {/* ----------------------------------------------------------- */}
            {whySubTab === 'provenance-cta' && (
              <div className="space-y-6 text-xs">
                {/* Material Provenance Grid */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                        Section 4 — Ethical Sourcing
                      </span>
                      <h3 className="text-base font-bold text-[#071F52]">
                        Material Provenance Cards ({draftWhyMindfree.provenanceSection.items.length})
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        setDraftWhyMindfree({
                          ...draftWhyMindfree,
                          provenanceSection: {
                            ...draftWhyMindfree.provenanceSection,
                            items: [
                              ...draftWhyMindfree.provenanceSection.items,
                              {
                                title: 'New Raw Material — Region',
                                desc: 'Provenance and sustainable harvesting details.',
                              },
                            ],
                          },
                        })
                      }
                      className="px-3.5 py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Provenance Card</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Section Eyebrow Tag
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.provenanceSection.eyebrow}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            provenanceSection: {
                              ...draftWhyMindfree.provenanceSection,
                              eyebrow: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Section Main Title
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.provenanceSection.title}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            provenanceSection: {
                              ...draftWhyMindfree.provenanceSection,
                              title: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {draftWhyMindfree.provenanceSection.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-[#0A2E73]">
                            Provenance #{idx + 1}
                          </span>
                          {draftWhyMindfree.provenanceSection.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setDraftWhyMindfree({
                                  ...draftWhyMindfree,
                                  provenanceSection: {
                                    ...draftWhyMindfree.provenanceSection,
                                    items: draftWhyMindfree.provenanceSection.items.filter(
                                      (_, i) => i !== idx
                                    ),
                                  },
                                })
                              }
                              className="text-rose-600 hover:text-rose-700 p-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                            Material &amp; Origin Title
                          </label>
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) => {
                              const next = [...draftWhyMindfree.provenanceSection.items];
                              next[idx] = { ...next[idx], title: e.target.value };
                              setDraftWhyMindfree({
                                ...draftWhyMindfree,
                                provenanceSection: {
                                  ...draftWhyMindfree.provenanceSection,
                                  items: next,
                                },
                              });
                            }}
                            className="w-full min-h-[38px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-white font-bold text-[#071F52] outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-[#64748B] mb-1">
                            Provenance Description
                          </label>
                          <textarea
                            rows={3}
                            value={item.desc}
                            onChange={(e) => {
                              const next = [...draftWhyMindfree.provenanceSection.items];
                              next[idx] = { ...next[idx], desc: e.target.value };
                              setDraftWhyMindfree({
                                ...draftWhyMindfree,
                                provenanceSection: {
                                  ...draftWhyMindfree.provenanceSection,
                                  items: next,
                                },
                              });
                            }}
                            className="w-full p-2.5 rounded-xl border border-[#E2E8F0] bg-white outline-none"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom CTA Banner */}
                <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                  <div className="border-b border-[#E2E8F0] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#E3262E] font-bold">
                      Section 5 — Bottom Conversion Banner
                    </span>
                    <h3 className="text-base font-bold text-[#071F52]">
                      Experience the Mindfree Difference CTA Banner
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        CTA Banner Heading
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.ctaBanner.title}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            ctaBanner: { ...draftWhyMindfree.ctaBanner, title: e.target.value },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold text-[#071F52] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        CTA Banner Subtitle
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.ctaBanner.subtitle}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            ctaBanner: {
                              ...draftWhyMindfree.ctaBanner,
                              subtitle: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Primary Button Text (Explore Mattresses)
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.ctaBanner.primaryButtonText}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            ctaBanner: {
                              ...draftWhyMindfree.ctaBanner,
                              primaryButtonText: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">
                        Secondary Button Text (Visit an Atelier)
                      </label>
                      <input
                        type="text"
                        value={draftWhyMindfree.ctaBanner.secondaryButtonText}
                        onChange={(e) =>
                          setDraftWhyMindfree({
                            ...draftWhyMindfree,
                            ctaBanner: {
                              ...draftWhyMindfree.ctaBanner,
                              secondaryButtonText: e.target.value,
                            },
                          })
                        }
                        className="w-full min-h-[40px] px-3 py-1.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] font-bold outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 3: STORAGE BUCKETS & MEDIA UPLOAD                           */}
        {/* =============================================================== */}
        {activeTab === 'storage' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Column: Storage Buckets & Create Bucket / Upload File */}
            <div className="lg:col-span-4 space-y-6">
              {/* Buckets List */}
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-[#E3262E]" />
                  <h2 className="text-base font-bold text-[#071F52]">Storage Buckets</h2>
                </div>
                <div className="space-y-2">
                  {buckets.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBucketId(b.id)}
                      className={`w-full p-3 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                        selectedBucketId === b.id
                          ? 'bg-[#0A2E73] text-white border-[#0A2E73] shadow-sm'
                          : 'bg-[#F8FAFC] text-[#071F52] border-[#E2E8F0] hover:border-[#0A2E73]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-bold truncate">{b.name}</div>
                        <div
                          className={`text-[10.5px] truncate ${
                            selectedBucketId === b.id ? 'text-white/75' : 'text-[#64748B]'
                          }`}
                        >
                          {b.description}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                          selectedBucketId === b.id
                            ? 'bg-white/20 text-white'
                            : 'bg-[#0A2E73]/10 text-[#0A2E73]'
                        }`}
                      >
                        {b.object_count} files
                      </span>
                    </button>
                  ))}
                </div>

                {/* Create New Bucket Form */}
                <form onSubmit={handleCreateBucket} className="pt-3 border-t border-[#E2E8F0] space-y-2.5 text-xs">
                  <div className="font-bold text-[#071F52]">Create New Storage Bucket</div>
                  <input
                    type="text"
                    required
                    value={newBucketName}
                    onChange={(e) => setNewBucketName(e.target.value)}
                    placeholder="Bucket name (e.g. campaign-banners)"
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                  />
                  <input
                    type="text"
                    value={newBucketDesc}
                    onChange={(e) => setNewBucketDesc(e.target.value)}
                    placeholder="Description..."
                    className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full min-h-[44px] py-2 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-semibold cursor-pointer"
                  >
                    + Create Storage Bucket
                  </button>
                </form>
              </div>

              {/* Upload Image to Selected Bucket */}
              <div className="bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-3 text-xs">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[#E3262E]" />
                  <h3 className="text-sm font-bold text-[#071F52]">
                    Upload Image to &ldquo;{selectedBucketId}&rdquo;
                  </h3>
                </div>
                <input
                  type="text"
                  value={uploadAltText}
                  onChange={(e) => setUploadAltText(e.target.value)}
                  placeholder="Optional image alt text / label..."
                  className="w-full min-h-[42px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                />
                <label className="w-full min-h-[48px] py-3 px-4 rounded-xl border-2 border-dashed border-[#0A2E73]/40 hover:border-[#E3262E] bg-[#F8FAFC] flex items-center justify-center gap-2 font-semibold text-[#0A2E73] cursor-pointer transition-colors">
                  <Upload className="w-4 h-4 text-[#E3262E]" />
                  <span>{isUploading ? 'Uploading Image...' : 'Choose Image File to Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Right Column: Files inside Selected Bucket */}
            <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#071F52]">
                  Files in Bucket: <span className="text-[#E3262E]">{selectedBucketId}</span> (
                  {filteredStorageObjects.length})
                </h2>
                <span className="text-xs text-[#64748B]">Active Media Library</span>
              </div>

              {filteredStorageObjects.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#94A3B8]">
                  No files uploaded to this bucket yet. Use the upload box on the left to store an image.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredStorageObjects.map((obj) => (
                    <div
                      key={obj.id}
                      className="p-3.5 rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC] flex items-center gap-3.5 justify-between"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={obj.public_url}
                          alt={obj.alt_text || obj.file_name}
                          className="w-16 h-16 rounded-xl object-contain p-1 border border-[#E2E8F0] bg-white shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-[#071F52] truncate">
                            {obj.file_name}
                          </div>
                          <div className="text-[10.5px] text-[#64748B] truncate">
                            {(obj.size_bytes / 1024).toFixed(1)} KB • {obj.mime_type}
                          </div>
                          <div className="text-[10px] font-mono text-[#0A2E73] truncate mt-0.5">
                            {obj.public_url}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(obj.public_url);
                            setCopiedUrl(obj.public_url);
                            setTimeout(() => setCopiedUrl(null), 2000);
                          }}
                          className="w-9 h-9 rounded-xl bg-white border border-[#E2E8F0] text-[#0A2E73] flex items-center justify-center cursor-pointer"
                          title="Copy Image URL"
                        >
                          {copiedUrl === obj.public_url ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteStorageObject(obj.id, obj.file_name)}
                          className="w-9 h-9 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 flex items-center justify-center cursor-pointer"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* =============================================================== */}
        {/* TAB 4: SITE CONTENT CMS & SYSTEM DIAGNOSTICS                    */}
        {/* =============================================================== */}
        {activeTab === 'content' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Complete Storefront Pages Sync & Quick Section Control */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#E3262E]" />
                  <h2 className="text-lg font-bold text-[#071F52]">
                    Storefront Pages Sync Control
                  </h2>
                </div>
                <p className="text-xs text-[#64748B]">
                  All 6 storefront sections are live-connected to the front end. Jump to any visual editor below or publish all pages in one click.
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  {
                    tab: 'homepage' as const,
                    title: '1. Home Page',
                    desc: `${draftHome.heroSlides.length} Hero Slides, ${draftHome.shopByRoom.rooms.length} Rooms, Quiz & Reviews`,
                  },
                  {
                    tab: 'products' as const,
                    title: '2. Mattresses & Mega-Menu Dropdown',
                    desc: `${draftMattresses.mattressModels.length} Mattress Models, Categories & Dropdown`,
                  },
                  {
                    tab: 'pillows' as const,
                    title: '3. Pillows & Navbar Dropdown',
                    desc: `${draftPillows.pillowModels.length} Ergonomic Pillows, Posture Guide & Dropdown`,
                  },
                  {
                    tab: 'why-mindfree' as const,
                    title: '4. Why Mindfree & Navbar Dropdown',
                    desc: `${draftWhyMindfree.dropdownLinks.length} Dropdown Items, Story Page, 4 Pillars & Specs`,
                  },
                  {
                    tab: 'footer' as const,
                    title: '5. Global Footer',
                    desc: `${draftFooter.promiseBadges.length} Promises, Socials, Columns & Legal Bar`,
                  },
                  {
                    tab: 'contact' as const,
                    title: '6. Contact Us & Inquiries Inbox',
                    desc: `${draftContact.formConfig.subjectOptions.length} Form Topics, Concierge Cards & ${inquiriesList.length} Inquiries`,
                  },
                ].map((sec) => (
                  <div
                    key={sec.tab}
                    className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-[#071F52] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{sec.title}</span>
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5 truncate">{sec.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleSwitchAdminTab(sec.tab)}
                      className="px-3 py-1.5 rounded-xl bg-white hover:bg-[#0A2E73] text-[#0A2E73] hover:text-white border border-[#E2E8F0] font-semibold text-[11px] shrink-0 cursor-pointer transition-colors"
                    >
                      Open Editor
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handlePublishAllStorefrontPages}
                className="w-full min-h-[48px] py-3 px-4 rounded-xl bg-[#E3262E] hover:bg-[#C8161D] text-white font-bold text-xs cursor-pointer shadow-[0_8px_20px_rgba(227,38,46,0.28)] flex items-center justify-center gap-2 transition-all"
              >
                <Save className="w-4 h-4 shrink-0" />
                <span>Save &amp; Publish All 6 Storefront Pages Now</span>
              </button>

              <div className="pt-3 border-t border-[#E2E8F0]">
                <form onSubmit={handleSaveContent} className="space-y-3 text-xs">
                  <div className="font-bold text-[#071F52] uppercase tracking-wider text-[11px]">
                    Custom Section Key Override
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">Section Key</label>
                      <input
                        type="text"
                        value={cmsKey}
                        onChange={(e) => setCmsKey(e.target.value)}
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-[#0F2952] mb-1">Badge Text</label>
                      <input
                        type="text"
                        value={cmsBadge}
                        onChange={(e) => setCmsBadge(e.target.value)}
                        className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">Headline Title</label>
                    <input
                      type="text"
                      value={cmsTitle}
                      onChange={(e) => setCmsTitle(e.target.value)}
                      className="w-full min-h-[40px] px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-[#0F2952] mb-1">Supporting Subtitle</label>
                    <textarea
                      rows={2}
                      value={cmsSubtitle}
                      onChange={(e) => setCmsSubtitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full min-h-[42px] py-2.5 rounded-xl bg-[#0A2E73] hover:bg-[#071F52] text-white font-semibold cursor-pointer shadow-sm"
                  >
                    Save Section Override
                  </button>
                </form>
              </div>
            </div>

            {/* Right: Live Server & Table Diagnostics */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-[#E2E8F0] p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-[#E3262E]" />
                  <h2 className="text-lg font-bold text-[#071F52]">
                    Live System &amp; Content Diagnostics
                  </h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold">
                  {pgHealth?.ok ? 'ONLINE' : 'CHECKING...'}
                </span>
              </div>

              {pgHealth?.stats && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="text-[#64748B]">Products &amp; Pillows</div>
                    <div className="font-bold text-lg text-[#071F52] mt-0.5">
                      {pgHealth.stats.products_count} Mattresses • {pgHealth.stats.pillows_count} Pillows
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="text-[#64748B]">Orders &amp; Customers</div>
                    <div className="font-bold text-lg text-[#071F52] mt-0.5">
                      {pgHealth.stats.orders_count} Orders • {pgHealth.stats.customers_count} Clients
                    </div>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                    <div className="text-[#64748B]">Reviews &amp; CMS Rows</div>
                    <div className="font-bold text-lg text-[#071F52] mt-0.5">
                      {pgHealth.stats.reviews_count} Reviews • {pgHealth.stats.content_count} CMS
                    </div>
                  </div>
                </div>
              )}

              {/* Saved CMS Rows Preview */}
              <div className="space-y-2 pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                  Active Site Content Rows ({siteContents.length})
                </h3>
                {siteContents.map((row) => (
                  <div
                    key={row.id}
                    className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-[#E3262E]">{row.section_key}</span>
                      <span className="text-[10.5px] text-[#64748B]">
                        Updated: {new Date(row.updated_at).toLocaleString()}
                      </span>
                    </div>
                    <div className="font-bold text-[#071F52]">{row.title}</div>
                    <div className="text-[#64748B]">{row.subtitle}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Detailed Inspection & Live Order Tracking Update Drawer / Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            <div
              className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
              onClick={() => setSelectedOrder(null)}
            />

            <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full overflow-y-auto flex flex-col justify-between p-6 sm:p-8">
              <div>
                <div className="flex items-center justify-between pb-4 border-b border-[#E2E8F0] mb-6">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-[#E3262E] font-bold">
                      Customer Order &amp; Live Tracking Control
                    </span>
                    <div className="flex items-center gap-3 mt-0.5">
                      <h2 className="text-xl font-serif font-bold text-[#071F52]">
                        {selectedOrder.orderId}
                      </h2>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getStatusBadgeStyle(
                          selectedOrder.orderStatus
                        )}`}
                      >
                        {selectedOrder.orderStatus}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="w-8 h-8 rounded-full bg-[#F8FAFC] hover:bg-[#DBEAFE] flex items-center justify-center text-[#071F52] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Live Tracking Update Form for this Customer */}
                <form
                  onSubmit={handlePostOrderTrackingUpdate}
                  className="mb-6 p-5 rounded-2xl bg-[#F8FAFC] border border-[#CCD8CA] space-y-4 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-[#071F52] uppercase tracking-wider">
                      Update Order Status &amp; Tracking for {selectedOrder.customer.fullName}
                    </label>
                    <span className="text-[10px] font-mono text-[#0A2E73] bg-[#DBEAFE] px-2 py-0.5 rounded-full font-bold">
                      Syncs Live to Customer Portal
                    </span>
                  </div>

                  {/* Quick 1-Click Stage Selector */}
                  <div>
                    <span className="block text-[11px] font-semibold text-[#64748B] mb-1.5">
                      Select Fulfillment Stage (Click to Update Immediately or Customize Below)
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {(
                        ['Confirmed', 'Preparing in Atelier', 'Dispatched', 'Delivered'] as const
                      ).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setTrackingStatusDraft(st);
                            handleStatusChange(selectedOrder.orderId, st, {
                              trackingNumber: trackingNumberDraft,
                              courierPartner: courierPartnerDraft,
                              estimatedDelivery: estimatedDeliveryDraft,
                            });
                          }}
                          className={`py-2.5 px-2.5 rounded-xl text-[11px] font-semibold text-center transition-all cursor-pointer ${
                            trackingStatusDraft === st
                              ? 'bg-[#0A2E73] text-white font-bold shadow-xs'
                              : 'bg-white border border-[#E2E8F0] text-[#55645D] hover:border-[#0A2E73]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tracking Number, Courier Partner & Estimated Delivery */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F2952] mb-1">
                        Tracking Waybill / AWB #
                      </label>
                      <input
                        type="text"
                        value={trackingNumberDraft}
                        onChange={(e) => setTrackingNumberDraft(e.target.value)}
                        placeholder="MF-TRK-88412-MUM"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] font-mono text-xs outline-none focus:border-[#0A2E73]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F2952] mb-1">
                        Courier / Fleet Partner
                      </label>
                      <input
                        type="text"
                        value={courierPartnerDraft}
                        onChange={(e) => setCourierPartnerDraft(e.target.value)}
                        placeholder="Mindfree White-Glove Fleet"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs outline-none focus:border-[#0A2E73]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F2952] mb-1">
                        Estimated Delivery Window
                      </label>
                      <input
                        type="text"
                        value={estimatedDeliveryDraft}
                        onChange={(e) => setEstimatedDeliveryDraft(e.target.value)}
                        placeholder="Monday, 28 Oct 2026"
                        className="w-full min-h-[38px] px-3 py-1.5 rounded-xl bg-white border border-[#E2E8F0] text-xs outline-none focus:border-[#0A2E73]"
                      />
                    </div>
                  </div>

                  {/* Custom Tracking Note for Customer */}
                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F2952] mb-1">
                      Tracking Update Message for Customer (Displayed in Customer Order Status)
                    </label>
                    <textarea
                      rows={2}
                      value={trackingNoteDraft}
                      onChange={(e) => setTrackingNoteDraft(e.target.value)}
                      placeholder="e.g. Dispatched from Bengaluru Atelier via White-Glove Fleet. Delivery specialist will call 2 hours before arrival."
                      className="w-full px-3 py-2 rounded-xl bg-white border border-[#E2E8F0] text-xs outline-none focus:border-[#0A2E73]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdatingTracking}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#E3262E] hover:bg-[#C8161D] text-white font-bold text-xs cursor-pointer shadow-sm transition-all flex items-center justify-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    <span>
                      {isUpdatingTracking
                        ? 'Publishing Tracking Update...'
                        : 'Publish Tracking Update to Customer Order Status'}
                    </span>
                  </button>
                </form>

                {/* Live Tracking History Log as Seen by the Customer */}
                <div className="mb-6 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                      Customer-Facing Tracking History ({selectedOrder.statusHistory?.length || 0} Updates)
                    </h3>
                    <span className="text-[10px] font-mono text-[#64748B]">
                      Visible to {selectedOrder.customer.email}
                    </span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] divide-y divide-[#E2E8F0] text-xs max-h-56 overflow-y-auto">
                    {(selectedOrder.statusHistory || [])
                      .slice()
                      .reverse()
                      .map((h, idx) => (
                        <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-[#E3262E] shrink-0" />
                              <span className="font-bold text-[#071F52]">{h.status}</span>
                              {h.courierWaybill && (
                                <span className="font-mono text-[10px] text-[#0A2E73] bg-[#DBEAFE] px-1.5 py-0.2 rounded">
                                  {h.courierWaybill}
                                </span>
                              )}
                            </div>
                            <p className="text-[#55645D] pl-4 leading-relaxed">{h.note}</p>
                            {h.courierPartner && (
                              <div className="text-[10px] text-[#94A3B8] pl-4">
                                Fleet: {h.courierPartner} • By: {h.updatedBy}
                              </div>
                            )}
                          </div>
                          <span className="text-[10px] font-mono text-[#94A3B8] shrink-0">
                            {new Date(h.timestamp).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                    Customer & Logistics Destination
                  </h3>
                  <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs text-[#55645D]">
                    <div className="font-semibold text-sm text-[#071F52]">
                      {selectedOrder.customer.fullName}
                    </div>
                    <div>{selectedOrder.customer.addressLine}</div>
                    <div>
                      {selectedOrder.customer.locality}, {selectedOrder.customer.city},{' '}
                      {selectedOrder.customer.state} — {selectedOrder.customer.pincode}
                    </div>
                    {selectedOrder.customer.landmark && (
                      <div className="text-[11px] text-[#94A3B8]">
                        Landmark: {selectedOrder.customer.landmark}
                      </div>
                    )}
                    <div className="pt-2 border-t border-[#E2E8F0] flex flex-wrap gap-4 text-xs font-medium text-[#0A2E73]">
                      <span className="flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5 text-[#E3262E]" /> +91{' '}
                        {selectedOrder.customer.phone}
                      </span>
                      <span className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-[#E3262E]" />{' '}
                        {selectedOrder.customer.email}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mb-6 space-y-3">
                  <h3 className="text-xs font-bold text-[#94A3B8] uppercase tracking-wider">
                    Handcrafted Mattresses
                  </h3>
                  <div className="space-y-3">
                    {selectedOrder.items.map((item) => (
                      <div
                        key={item.sku}
                        className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex gap-3.5 items-center"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-14 rounded-xl object-contain p-1 bg-white border border-[#E2E8F0] shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-serif font-bold text-[#071F52] truncate">
                            {item.name}
                          </h4>
                          <div className="text-[11px] text-[#64748B]">
                            {item.size} • {item.thickness}
                          </div>
                          <div className="text-[10px] text-[#94A3B8] font-mono">
                            SKU: {item.sku} | Qty: {item.quantity}
                          </div>
                        </div>
                        <div className="text-xs font-bold text-[#071F52]">
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2 text-xs text-[#55645D]">
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-semibold text-[#071F52] uppercase font-mono">
                      {selectedOrder.paymentMethod}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Status</span>
                    <span className="font-semibold text-emerald-800">
                      {selectedOrder.paymentStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tracking Reference</span>
                    <span className="font-mono text-[#E3262E] font-bold">
                      {selectedOrder.trackingNumber}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-[#E2E8F0] flex items-baseline justify-between font-serif text-sm font-bold text-[#071F52]">
                    <span>Total Order Value</span>
                    <span className="text-base text-[#0A2E73]">
                      ₹{selectedOrder.total.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="w-full py-3 rounded-xl bg-[#0A2E73] text-[#F8FAFC] text-xs font-semibold hover:bg-[#071F52] cursor-pointer"
                >
                  Close Inspection
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirm Product Deletion Modal */}
        {pendingDeleteProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#071F52]/60 backdrop-blur-xs">
            <div className="w-full max-w-md bg-white rounded-3xl border border-[#E2E8F0] shadow-[0_24px_60px_rgba(7,31,82,0.28)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
              <div className="bg-[#0A2E73] px-6 py-4 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
                    <Trash2 className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">
                      Confirm Product Deletion
                    </h3>
                    <p className="text-[11px] text-white/80">
                      Please confirm before removing this {pendingDeleteProduct.type}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingDeleteProduct(null)}
                  className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5 text-xs">
                <div className="p-3.5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center gap-3.5">
                  <img
                    src={pendingDeleteProduct.image}
                    alt={pendingDeleteProduct.name}
                    className="w-16 h-16 rounded-xl object-contain p-1 border border-[#E2E8F0] shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider mb-1">
                      {pendingDeleteProduct.type === 'mattress' ? 'Mattress Model' : 'Pillow Model'}
                    </span>
                    <h4 className="text-sm font-bold text-[#071F52] truncate">
                      {pendingDeleteProduct.name}
                    </h4>
                    <div className="text-[11px] font-bold text-[#0A2E73] mt-0.5">
                      Starting Price: ₹{Number(pendingDeleteProduct.price || 0).toLocaleString('en-IN')}
                    </div>
                  </div>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">
                  Are you sure you want to delete{' '}
                  <strong className="text-[#071F52]">"{pendingDeleteProduct.name}"</strong>? Once confirmed, this product will be removed from the storefront catalogue.
                </p>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={() => setPendingDeleteProduct(null)}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#F8FAFC] hover:bg-[#EFF6FF] text-[#071F52] border border-[#CBD5E1] font-bold text-xs cursor-pointer transition-colors"
                  >
                    No, Keep Product
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteProduct}
                    className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#E3262E] hover:bg-[#C8161D] text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 shadow-md cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Delete Product</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
