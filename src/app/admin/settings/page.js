'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Save, RefreshCw, Upload, Image as ImageIcon, CheckCircle, Plus, Trash2, ArrowUp, ArrowDown, Settings, Megaphone, Layout, Grid, GripVertical, X, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useShop, parseSettings } from '../../../context/ShopContext';
import useBodyScrollLock from '../../../hooks/useBodyScrollLock';
import SocialIcon from '../../../components/SocialIcon';

const BUILTIN_ICONS = [
  { key: 'instagram', label: 'Instagram' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'youtube', label: 'YouTube' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'google-maps', label: 'Google Maps' },
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'globe', label: 'Globe' },
  { key: 'link', label: 'Link' },
  { key: 'external-link', label: 'External Link' },
  { key: 'phone', label: 'Phone' },
  { key: 'mail', label: 'Mail' },
  { key: 'map-pin', label: 'Map Pin' },
  { key: 'store', label: 'Store' },
  { key: 'shopping-bag', label: 'Shopping Bag' },
  { key: 'support', label: 'Support' },
  { key: 'star', label: 'Star' },
  { key: 'heart', label: 'Heart' },
  { key: 'home', label: 'Home' },
  { key: 'info', label: 'Info' }
];

export default function AdminSettings() {
  const { settings: shopSettings, refreshShopData } = useShop();

  // Tab State
  const [activeTab, setActiveTab] = useState('general'); // general, announcement, hero, promo

  // Social Links States
  const [socialLinks, setSocialLinks] = useState([]);
  const [deletedSocialLinkIds, setDeletedSocialLinkIds] = useState([]);
  const [socialLinksLoading, setSocialLinksLoading] = useState(true);
  const [activeIconPickerLinkId, setActiveIconPickerLinkId] = useState(null);
  const [socialLinksExpanded, setSocialLinksExpanded] = useState(false);

  // Settings states
  const [formData, setFormData] = useState({
    id: null,
    shop_name: '',
    whatsapp_number: '',
    email: '',
    address: '',
    announcement_text: '',
    announcement_enabled: true,
    header_tagline: '',
    footer_description: '',
    footer_copyright: '',
    ordering_guidelines: '',
    hero_title: '',
    hero_subtitle: '',
    hero_btn_text: '',
    hero_btn_link: '',
    categories_section_title: '',
    categories_section_enabled: true,
    cta_title: '',
    cta_description: '',
    cta_btn_text: '',
    cta_enabled: true,
    cta_whatsapp_text: ''
  });

  const [promoCards, setPromoCards] = useState([]);
  const [sections, setSections] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filters, setFilters] = useState({});
  const [activeSelectorSectionId, setActiveSelectorSectionId] = useState(null);
  const activeSection = sections.find(s => s.id === activeSelectorSectionId);
  const [expandedSections, setExpandedSections] = useState({});
  const [expandedSelectorSelected, setExpandedSelectorSelected] = useState(false);
  const [expandedSelectorCatalog, setExpandedSelectorCatalog] = useState(false);

  const toggleSectionExpanded = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  // Current media URLs
  const [logoUrl, setLogoUrl] = useState(null);
  const [heroBannerUrl, setHeroBannerUrl] = useState(null);

  // Newly selected file objects
  const [newLogoFile, setNewLogoFile] = useState(null);
  const [newHeroFile, setNewHeroFile] = useState(null);

  // File input refs
  const logoInputRef = useRef(null);
  const heroInputRef = useRef(null);

  // Local preview blobs
  const [logoPreview, setLogoPreview] = useState(null);
  const [heroPreview, setHeroPreview] = useState(null);

  // Page interaction states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch settings from DB
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setErrorMsg('');

      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        const s = parseSettings(data[0]);
        setFormData({
          id: s.id,
          shop_name: s.shop_name || '',
          whatsapp_number: s.whatsapp_number || '',
          email: s.email || '',
          address: s.address || '',
          announcement_text: s.announcement_text || '',
          announcement_enabled: s.announcement_enabled ?? true,
          header_tagline: s.header_tagline || '',
          footer_description: s.footer_description || '',
          footer_copyright: s.footer_copyright || '',
          ordering_guidelines: s.ordering_guidelines || '',
          hero_title: s.hero_title || '',
          hero_subtitle: s.hero_subtitle || '',
          hero_btn_text: s.hero_btn_text || '',
          hero_btn_link: s.hero_btn_link || '',
          categories_section_title: s.categories_section_title || '',
          categories_section_enabled: s.categories_section_enabled ?? true,
          cta_title: s.cta_title || '',
          cta_description: s.cta_description || '',
          cta_btn_text: s.cta_btn_text || '',
          cta_enabled: s.cta_enabled ?? true,
          cta_whatsapp_text: s.cta_whatsapp_text || ''
        });
        setPromoCards(s.promo_cards || []);
        setSections(s.sections || []);
          setLogoUrl(s.logo_url);
          setHeroBannerUrl(s.hero_banner_url);
        }
      } catch (err) {
        console.error('Error fetching settings:', err);
        setErrorMsg('Failed to load settings from database.');
      } finally {
        setLoading(false);
      }
    };

    const fetchProductsList = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('id, name, category_id')
          .order('name', { ascending: true });
        if (!error && data) {
          setProductsList(data);
        }
      } catch (e) {
        console.error('Failed to load products list:', e);
      }
    };

    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name')
          .order('name', { ascending: true });
        if (!error && data) {
          setCategories(data);
        }
      } catch (e) {
        console.error('Failed to load categories list:', e);
      }
    };

    const fetchSocialLinks = async () => {
      try {
        setSocialLinksLoading(true);
        const { data, error } = await supabase
          .from('social_links')
          .select('*')
          .order('display_order', { ascending: true });
        
        if (error) {
          console.error('Error fetching social links:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        setSocialLinks(data || []);
      } catch (err) {
        console.error('Error loading social links:', err);
        setErrorMsg(`Failed to load social links: ${err.message || err}`);
      } finally {
        setSocialLinksLoading(false);
      }
    };

    const handleAddSocialLink = () => {
      const newLink = {
        id: `temp-${Date.now()}`,
        label: '',
        url: '',
        icon_key: 'link',
        display_order: socialLinks.length + 1,
        is_active: true,
        is_default: false
      };
      setSocialLinks(prev => [...prev, newLink]);
      setSocialLinksExpanded(true);
    };

    const handleDeleteSocialLink = (id) => {
      if (!String(id).startsWith('temp-')) {
        setDeletedSocialLinkIds(prev => [...prev, id]);
      }
      setSocialLinks(prev => prev.filter(link => link.id !== id));
    };

    const handleSocialLinkChange = (id, field, value) => {
      setSocialLinks(prev =>
        prev.map(link => link.id === id ? { ...link, [field]: value } : link)
      );
    };

    const handleMoveLinkUp = (idx) => {
      if (idx === 0) return;
      setSocialLinks(prev => {
        const copy = [...prev];
        const temp = copy[idx];
        copy[idx] = copy[idx - 1];
        copy[idx - 1] = temp;
        return copy.map((link, i) => ({ ...link, display_order: i + 1 }));
      });
    };

    const handleMoveLinkDown = (idx) => {
      if (idx === socialLinks.length - 1) return;
      setSocialLinks(prev => {
        const copy = [...prev];
        const temp = copy[idx];
        copy[idx] = copy[idx + 1];
        copy[idx + 1] = temp;
        return copy.map((link, i) => ({ ...link, display_order: i + 1 }));
      });
    };

    useBodyScrollLock(!!activeSelectorSectionId);
    useBodyScrollLock(!!activeIconPickerLinkId);
  
    useEffect(() => {
      fetchSettings();
      fetchProductsList();
      fetchCategories();
      fetchSocialLinks();
    }, []);

  const handleFilterChange = (sectionId, field, value) => {
    setFilters(prev => ({
      ...prev,
      [sectionId]: {
        ...(prev[sectionId] || { category: '', search: '' }),
        [field]: value
      }
    }));
  };

  const getFilteredProducts = (sectionId) => {
    const secFilters = filters[sectionId] || { category: '', search: '' };
    const catId = secFilters.category;
    const searchQ = secFilters.search.toLowerCase().trim();

    return productsList.filter(p => {
      const section = sections.find(s => s.id === sectionId);
      if (section && (section.productIds || []).some(id => String(id) === String(p.id))) {
        return false;
      }

      if (catId && p.category_id !== catId) {
        return false;
      }

      if (searchQ && !p.name.toLowerCase().includes(searchQ)) {
        return false;
      }

      return true;
    });
  };

  // Update form values if they change in global context (as a fallback)
  useEffect(() => {
    if (shopSettings && !formData.id) {
      const s = shopSettings;
      setFormData({
        id: s.id || null,
        shop_name: s.shop_name || '',
        whatsapp_number: s.whatsapp_number || '',
        email: s.email || '',
        address: s.address || '',
        announcement_text: s.announcement_text || '',
        announcement_enabled: s.announcement_enabled ?? true,
        header_tagline: s.header_tagline || '',
        footer_description: s.footer_description || '',
        footer_copyright: s.footer_copyright || '',
        ordering_guidelines: s.ordering_guidelines || '',
        hero_title: s.hero_title || '',
        hero_subtitle: s.hero_subtitle || '',
        hero_btn_text: s.hero_btn_text || '',
        hero_btn_link: s.hero_btn_link || '',
        categories_section_title: s.categories_section_title || '',
        categories_section_enabled: s.categories_section_enabled ?? true,
        cta_title: s.cta_title || '',
        cta_description: s.cta_description || '',
        cta_btn_text: s.cta_btn_text || '',
        cta_enabled: s.cta_enabled ?? true,
        cta_whatsapp_text: s.cta_whatsapp_text || ''
      });
      setPromoCards(s.promo_cards || []);
      setSections(s.sections || []);
      setLogoUrl(s.logo_url);
      setHeroBannerUrl(s.hero_banner_url);
    }
  }, [shopSettings]);

  // Handle file selections
  const handleLogoFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNewLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleHeroFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setNewHeroFile(file);
    setHeroPreview(URL.createObjectURL(file));
  };

  // --- PROMO CARDS HANDLERS ---
  const handleAddPromoCard = () => {
    const cardId = `promo-${Date.now()}`;
    const newCard = {
      id: cardId,
      tag: 'New Offer',
      title: 'Promotional Card Title',
      subtitle: 'Add a description here.',
      btn_text: 'Explore Now',
      btn_link: '/',
      is_dark: false,
      is_active: true
    };
    setPromoCards(prev => [...prev, newCard]);

    // Auto-scroll to the new promo card
    setTimeout(() => {
      const element = document.getElementById(`promo-container-${cardId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleRemovePromoCard = (id) => {
    setPromoCards(prev => prev.filter(card => card.id !== id));
  };

  const handlePromoCardChange = (id, field, value) => {
    setPromoCards(prev =>
      prev.map(card => card.id === id ? { ...card, [field]: value } : card)
    );
  };

  const handleMoveCardUp = (idx) => {
    if (idx === 0) return;
    setPromoCards(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const handleMoveCardDown = (idx) => {
    if (idx === promoCards.length - 1) return;
    setPromoCards(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  // --- SECTION HANDLERS ---
  const handleAddSection = () => {
    const sectionId = `section-${Date.now()}`;
    const newSection = {
      id: sectionId,
      title: 'New Section',
      enabled: true,
      type: 'products',
      mode: 'auto',
      productIds: [],
      limit: 8
    };
    setSections(prev => [...prev, newSection]);

    // Auto-scroll to the new section
    setTimeout(() => {
      const element = document.getElementById(`section-container-${sectionId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
  };

  const handleRemoveSection = (id) => {
    setSections(prev => prev.filter(sec => sec.id !== id));
  };

  // --- DRAG AND DROP PRODUCT REORDERING HANDLERS ---
  const handleDragStart = (e, index, sectionId) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ index, sectionId }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const reorderProductIds = (sectionId, sourceIndex, targetIndex) => {
    setSections(prev => 
      prev.map(sec => {
        if (sec.id === sectionId) {
          const productIds = [...(sec.productIds || [])];
          if (sourceIndex < 0 || sourceIndex >= productIds.length) return sec;
          if (targetIndex < 0 || targetIndex >= productIds.length) return sec;
          const [movedId] = productIds.splice(sourceIndex, 1);
          productIds.splice(targetIndex, 0, movedId);
          return { ...sec, productIds };
        }
        return sec;
      })
    );
  };

  const handleMoveProductUp = (sectionId, idx) => {
    if (idx === 0) return;
    setSections(prev => 
      prev.map(sec => {
        if (sec.id === sectionId) {
          const productIds = [...(sec.productIds || [])];
          const temp = productIds[idx];
          productIds[idx] = productIds[idx - 1];
          productIds[idx - 1] = temp;
          return { ...sec, productIds };
        }
        return sec;
      })
    );
  };

  const handleMoveProductDown = (sectionId, idx, maxLen) => {
    if (idx === maxLen - 1) return;
    setSections(prev => 
      prev.map(sec => {
        if (sec.id === sectionId) {
          const productIds = [...(sec.productIds || [])];
          const temp = productIds[idx];
          productIds[idx] = productIds[idx + 1];
          productIds[idx + 1] = temp;
          return { ...sec, productIds };
        }
        return sec;
      })
    );
  };

  const handleDrop = (e, targetIndex, targetSectionId) => {
    e.preventDefault();
    try {
      const dataStr = e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const { index: sourceIndex, sectionId: sourceSectionId } = JSON.parse(dataStr);
      
      if (sourceSectionId !== targetSectionId) return;
      if (sourceIndex === targetIndex) return;

      reorderProductIds(targetSectionId, sourceIndex, targetIndex);
    } catch (err) {
      console.error('Drag and drop drop handler failed:', err);
    }
  };

  const touchDragInfo = useRef(null);

  const handleTouchStart = (e, index, sectionId) => {
    touchDragInfo.current = {
      index,
      sectionId,
      startY: e.touches[0].clientY
    };
  };

  const handleTouchMove = (e) => {
    const info = touchDragInfo.current;
    if (!info) return;

    const touch = e.touches[0];
    const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!targetEl) return;

    const itemEl = targetEl.closest('[data-drag-type="product-item"]');
    if (itemEl) {
      const targetSectionId = itemEl.getAttribute('data-section-id');
      const targetIndex = parseInt(itemEl.getAttribute('data-index'), 10);

      if (targetSectionId === info.sectionId && targetIndex !== info.index) {
        if (e.cancelable) {
          e.preventDefault();
        }
        reorderProductIds(info.sectionId, info.index, targetIndex);
        info.index = targetIndex;
      }
    }
  };

  const handleTouchEnd = () => {
    touchDragInfo.current = null;
  };

  const handleSectionProductAdd = (sectionId, productId) => {
    setSections(prev =>
      prev.map(sec =>
        sec.id === sectionId
          ? { ...sec, productIds: [...(sec.productIds || []), productId] }
          : sec
      )
    );
  };

  const handleSectionProductRemove = (sectionId, productId) => {
    setSections(prev =>
      prev.map(sec =>
        sec.id === sectionId
          ? { ...sec, productIds: (sec.productIds || []).filter(id => id !== productId) }
          : sec
      )
    );
  };

  const handleSectionChange = (sectionId, field, value) => {
    setSections(prev =>
      prev.map(sec => sec.id === sectionId ? { ...sec, [field]: value } : sec)
    );
  };

  const handleMoveSectionUp = (idx) => {
    if (idx === 0) return;
    setSections(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx - 1];
      copy[idx - 1] = temp;
      return copy;
    });
  };

  const handleMoveSectionDown = (idx) => {
    if (idx === sections.length - 1) return;
    setSections(prev => {
      const copy = [...prev];
      const temp = copy[idx];
      copy[idx] = copy[idx + 1];
      copy[idx + 1] = temp;
      return copy;
    });
  };

  // --- SAVE ACTION ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    
    if (!formData.shop_name.trim() || !formData.whatsapp_number.trim()) {
      setErrorMsg('Shop Name and WhatsApp Number are required.');
      return;
    }

    try {
      setSaving(true);
      setErrorMsg('');
      setSaveSuccess(false);

      let finalLogoUrl = logoUrl;
      let finalHeroUrl = heroBannerUrl;

      // 1. Upload new logo if selected
      if (newLogoFile) {
        const fileExt = newLogoFile.name.split('.').pop();
        const fileName = `logo-${Date.now()}.${fileExt}`;
        const filePath = `settings/${fileName}`;

        const { error: logoUploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, newLogoFile);

        if (logoUploadError) throw logoUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        finalLogoUrl = publicUrl;
      }

      // 2. Upload new hero banner if selected
      if (newHeroFile) {
        const fileExt = newHeroFile.name.split('.').pop();
        const fileName = `hero-banner-${Date.now()}.${fileExt}`;
        const filePath = `settings/${fileName}`;

        const { error: heroUploadError } = await supabase.storage
          .from('product-images')
          .upload(filePath, newHeroFile);

        if (heroUploadError) throw heroUploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(filePath);

        finalHeroUrl = publicUrl;
      }

      // 3. Serialize extra settings into the JSON structure for the address column
      const addressJsonStore = {
        address: formData.address.trim(),
        announcement_text: formData.announcement_text.trim(),
        announcement_enabled: formData.announcement_enabled,
        header_tagline: formData.header_tagline.trim(),
        footer_description: formData.footer_description.trim(),
        footer_copyright: formData.footer_copyright.trim(),
        ordering_guidelines: formData.ordering_guidelines.trim(),
        hero_title: formData.hero_title.trim(),
        hero_subtitle: formData.hero_subtitle.trim(),
        hero_btn_text: formData.hero_btn_text.trim(),
        hero_btn_link: formData.hero_btn_link.trim(),
        promo_cards: promoCards,
        sections: sections.map(sec => ({
          ...sec,
          limit: sec.limit && !isNaN(Number(sec.limit)) ? Number(sec.limit) : 8
        })),
        categories_section_title: formData.categories_section_title.trim(),
        categories_section_enabled: formData.categories_section_enabled,
        cta_title: formData.cta_title.trim(),
        cta_description: formData.cta_description.trim(),
        cta_btn_text: formData.cta_btn_text.trim(),
        cta_enabled: formData.cta_enabled,
        cta_whatsapp_text: formData.cta_whatsapp_text.trim()
      };

      const settingsPayload = {
        shop_name: formData.shop_name.trim(),
        whatsapp_number: formData.whatsapp_number.trim().replace(/\D/g, ''), // clean numbers only
        email: formData.email.trim() || null,
        address: JSON.stringify(addressJsonStore), // Store serialized configuration
        logo_url: finalLogoUrl,
        hero_banner_url: finalHeroUrl
      };

      if (formData.id) {
        // Update existing row
        const { error } = await supabase
          .from('settings')
          .update(settingsPayload)
          .eq('id', formData.id);

        if (error) throw error;
      } else {
        // Insert new row
        const { error } = await supabase
          .from('settings')
          .insert([settingsPayload]);

        if (error) throw error;
      }

      // 4. Save/Update/Delete Social Links
      // A. Delete removed links
      if (deletedSocialLinkIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('social_links')
          .delete()
          .in('id', deletedSocialLinkIds);
        
        if (deleteError) {
          console.error('Error deleting social links:', {
            message: deleteError.message,
            details: deleteError.details,
            hint: deleteError.hint,
            code: deleteError.code
          });
          throw deleteError;
        }
      }

      // B. Insert / Update remaining links
      for (const link of socialLinks) {
        const linkPayload = {
          label: link.label?.trim() || '',
          url: link.url?.trim() || '',
          icon_key: link.icon_key,
          display_order: link.display_order,
          is_active: link.is_active,
          is_default: link.is_default
        };

        if (String(link.id).startsWith('temp-')) {
          // Insert new custom link
          const { error: insertError } = await supabase
            .from('social_links')
            .insert([linkPayload]);
          
          if (insertError) {
            console.error('Error inserting social link:', {
              message: insertError.message,
              details: insertError.details,
              hint: insertError.hint,
              code: insertError.code
            });
            throw insertError;
          }
        } else {
          // Update existing link
          const { error: updateError } = await supabase
            .from('social_links')
            .update(linkPayload)
            .eq('id', link.id);
          
          if (updateError) {
            console.error('Error updating social link:', {
              message: updateError.message,
              details: updateError.details,
              hint: updateError.hint,
              code: updateError.code
            });
            throw updateError;
          }
        }
      }

      // Reset deleted links array
      setDeletedSocialLinkIds([]);

      // Clear local file states
      setNewLogoFile(null);
      setNewHeroFile(null);
      setLogoPreview(null);
      setHeroPreview(null);

      // Refresh data
      await fetchSettings();
      await fetchSocialLinks();
      await refreshShopData(); // Refresh global shop context
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err) {
      console.error('Error saving settings:', err);
      setErrorMsg(err.message || 'An error occurred while saving settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <RefreshCw size={32} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 16px auto' }} />
        <p>Loading shop settings...</p>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeIn var(--transition-normal)' }}>
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Website Content & Settings</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Fully configure announcement bars, hero banners, promo cards, and shop details
          </p>
        </div>
      </div>

      {/* Success Notification */}
      {saveSuccess && (
        <div className="badge success" style={{ width: '100%', padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '20px', borderRadius: 'var(--radius-md)' }}>
          <CheckCircle size={16} />
          <span>Website content settings updated successfully!</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <div className="badge danger" style={{ width: '100%', padding: '12px', display: 'block', textAlign: 'center', marginBottom: '20px', borderRadius: 'var(--radius-md)' }}>
          {errorMsg}
        </div>
      )}

      {/* Tabs Navigation */}
      <div style={{
        display: 'flex',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '20px',
        gap: '4px',
        overflowX: 'auto'
      }}>
        <button
          onClick={() => setActiveTab('general')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderBottom: activeTab === 'general' ? '2px solid var(--text-primary)' : '2px solid transparent',
            color: activeTab === 'general' ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Settings size={16} />
          General Settings
        </button>
        <button
          onClick={() => setActiveTab('announcement')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderBottom: activeTab === 'announcement' ? '2px solid var(--text-primary)' : '2px solid transparent',
            color: activeTab === 'announcement' ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Megaphone size={16} />
          Announcement Bar
        </button>
        <button
          onClick={() => setActiveTab('hero')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderBottom: activeTab === 'hero' ? '2px solid var(--text-primary)' : '2px solid transparent',
            color: activeTab === 'hero' ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layout size={16} />
          Hero Banner
        </button>
        <button
          onClick={() => setActiveTab('promo')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderBottom: activeTab === 'promo' ? '2px solid var(--text-primary)' : '2px solid transparent',
            color: activeTab === 'promo' ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Grid size={16} />
          Promotional Cards ({promoCards.length})
        </button>
        <button
          onClick={() => setActiveTab('builder')}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            fontWeight: '600',
            borderBottom: activeTab === 'builder' ? '2px solid var(--text-primary)' : '2px solid transparent',
            color: activeTab === 'builder' ? 'var(--text-primary)' : 'var(--text-secondary)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layout size={16} />
          Homepage Builder
        </button>
      </div>

      {/* Settings Form */}
      <section className="admin-card">
        <form onSubmit={handleSaveSettings}>
          
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="form-grid" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              <div className="form-group">
                <label className="form-label">Shop Name *</label>
                <input
                  type="text"
                  placeholder={shopSettings?.shop_name || "MahaMaya Mobiles"}
                  value={formData.shop_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
                  required
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Header Tagline / Subtitle</label>
                <input
                  type="text"
                  placeholder="Premium Mobile Accessories Store"
                  value={formData.header_tagline}
                  onChange={(e) => setFormData(prev => ({ ...prev, header_tagline: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">WhatsApp Checkout Number *</label>
                <input
                  type="text"
                  placeholder="919796628335"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, whatsapp_number: e.target.value }))}
                  required
                  className="form-input"
                />
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  Must include country code (e.g. 91 for India) without '+' or spaces. Format: 919796628335.
                </span>
              </div>

              <div className="form-group">
                <label className="form-label">Contact Email (Optional)</label>
                <input
                  type="email"
                  placeholder="info@coverszone.com"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Physical Shop Address</label>
                <textarea
                  placeholder="Shop No. 5, Main Retail Market, Mumbai, India"
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Footer Description</label>
                <textarea
                  placeholder="Tell your customers about the shop profile..."
                  value={formData.footer_description}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_description: e.target.value }))}
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Footer Copyright Statement</label>
                <input
                  type="text"
                  placeholder={`© ${new Date().getFullYear()} ${shopSettings?.shop_name || "MahaMaya Mobiles"}. All rights reserved.`}
                  value={formData.footer_copyright}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_copyright: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ordering Guidelines (shown in Cart)</label>
                <input
                  type="text"
                  placeholder="Instructions for order delivery..."
                  value={formData.ordering_guidelines}
                  onChange={(e) => setFormData(prev => ({ ...prev, ordering_guidelines: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* Social & Website Links Section */}
              <div className="form-group full-width" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h3 className="form-label" style={{ fontSize: '14px', fontWeight: '800', margin: 0, textTransform: 'none', color: 'var(--text-primary)' }}>Social & Website Links</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Manage links to social media profiles and external websites. Publicly visible icons will appear in the Footer and About Us popup.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSocialLink}
                    className="admin-primary-btn"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Plus size={14} />
                    Add Custom Link
                  </button>
                </div>

                {socialLinksLoading ? (
                  <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} style={{ animation: 'spin 1.5s linear infinite', margin: '0 auto 8px auto' }} />
                    <span>Loading social links...</span>
                  </div>
                ) : socialLinks.length === 0 ? (
                  <div style={{ padding: '30px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <span>No social links configured. Click "Add Custom Link" to add one.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {(socialLinksExpanded ? socialLinks : socialLinks.slice(0, 2)).map((link) => {
                      const idx = socialLinks.findIndex(l => l.id === link.id);
                      return (
                        <div
                        key={link.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          background: 'var(--bg-secondary)',
                          padding: '12px 16px',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-color)',
                          flexWrap: 'wrap'
                        }}
                      >
                        {/* Drag indicator / Reorder controls */}
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveLinkUp(idx)}
                            className="admin-action-btn edit"
                            style={{ padding: '4px', cursor: idx === 0 ? 'not-allowed' : 'pointer' }}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === socialLinks.length - 1}
                            onClick={() => handleMoveLinkDown(idx)}
                            className="admin-action-btn edit"
                            style={{ padding: '4px', cursor: idx === socialLinks.length - 1 ? 'not-allowed' : 'pointer' }}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                        </div>

                        {/* Icon Picker Trigger */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Icon</span>
                          <button
                            type="button"
                            onClick={() => setActiveIconPickerLinkId(link.id)}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1px solid var(--border-color)',
                              background: 'var(--bg-primary)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                              color: 'var(--text-primary)'
                            }}
                            title="Choose Icon"
                          >
                            <SocialIcon iconKey={link.icon_key} size={20} />
                          </button>
                        </div>

                        {/* Label field */}
                        <div style={{ flex: '1 1 180px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Label</span>
                          <input
                            type="text"
                            value={link.label || ''}
                            onChange={(e) => handleSocialLinkChange(link.id, 'label', e.target.value)}
                            placeholder="e.g. Instagram, WhatsApp"
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '13px' }}
                          />
                        </div>

                        {/* URL field */}
                        <div style={{ flex: '2 1 280px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>URL</span>
                          <input
                            type="text"
                            value={link.url || ''}
                            onChange={(e) => handleSocialLinkChange(link.id, 'url', e.target.value)}
                            placeholder="https://instagram.com/myusername"
                            className="form-input"
                            style={{ padding: '8px 12px', fontSize: '13px' }}
                          />
                        </div>

                        {/* Active checkbox */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '80px', alignItems: 'center' }}>
                          <span style={{ fontSize: '10px', fontWeight: '700', textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Active</span>
                          <label className="form-checkbox-group" style={{ margin: 0 }}>
                            <input
                              type="checkbox"
                              checked={link.is_active ?? true}
                              onChange={(e) => handleSocialLinkChange(link.id, 'is_active', e.target.checked)}
                              className="form-checkbox"
                            />
                          </label>
                        </div>

                        {/* Custom status indicator & delete button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {!link.is_default ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteSocialLink(link.id)}
                              className="admin-action-btn delete"
                              style={{ padding: '8px' }}
                              title="Delete Link"
                            >
                              <Trash2 size={16} />
                            </button>
                          ) : (
                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600', padding: '0 8px', textTransform: 'uppercase' }} title="Default link cannot be deleted, but can be disabled.">
                              Default
                            </span>
                          )}
                        </div>
                      </div>
                    );
                   })}
                   {socialLinks.length > 2 && (
                     <button
                       type="button"
                       onClick={() => setSocialLinksExpanded(!socialLinksExpanded)}
                       className="admin-secondary-btn"
                       style={{
                         alignSelf: 'center',
                         marginTop: '8px',
                         padding: '6px 16px',
                         fontSize: '13px',
                         display: 'flex',
                         alignItems: 'center',
                         gap: '6px',
                       }}
                     >
                       {socialLinksExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                       {socialLinksExpanded ? 'Show Less' : `Show More (${socialLinks.length - 2} more)`}
                     </button>
                   )}
                 </div>
               )}
              </div>

              {/* Logo Upload */}
              <div className="form-group full-width" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px', marginTop: '10px' }}>
                <label className="form-label">Shop Logo</label>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                  <div style={{
                    width: '80px',
                    height: '80px',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : logoUrl ? (
                      <img src={logoUrl} alt="Shop logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    ) : (
                      <ImageIcon size={28} style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      className="admin-secondary-btn"
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      <Upload size={14} />
                      Upload Logo Image
                    </button>
                    <input
                      type="file"
                      ref={logoInputRef}
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      style={{ display: 'none' }}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                      PNG, JPG, SVG supported • 1000 × 250 px recommended
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ANNOUNCEMENT BAR */}
          {activeTab === 'announcement' && (
            <div className="form-grid" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              <div className="form-group full-width">
                <label className="form-checkbox-group" style={{ marginBottom: '16px' }}>
                  <input
                    type="checkbox"
                    checked={formData.announcement_enabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, announcement_enabled: e.target.checked }))}
                    className="form-checkbox"
                  />
                  <span className="form-label" style={{ margin: 0, fontWeight: '700' }}>Enable Announcement Bar</span>
                </label>
              </div>

              <div className="form-group full-width">
                <label className="form-label">Announcement Text</label>
                <input
                  type="text"
                  placeholder="✨ Free Shipping on Orders Above ₹499! Order directly on WhatsApp."
                  value={formData.announcement_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, announcement_text: e.target.value }))}
                  className="form-input"
                  disabled={!formData.announcement_enabled}
                />
              </div>
            </div>
          )}

          {/* TAB 3: HERO BANNER */}
          {activeTab === 'hero' && (
            <div className="form-grid" style={{ animation: 'fadeIn 0.25s ease-out' }}>
              <div className="form-group full-width">
                <label className="form-label">Hero Banner Title</label>
                <input
                  type="text"
                  placeholder="Elevate Your Phone's Protection & Style"
                  value={formData.hero_title}
                  onChange={(e) => setFormData(prev => ({ ...prev, hero_title: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group full-width">
                <label className="form-label">Hero Subtitle</label>
                <textarea
                  placeholder="Describe your stock collection..."
                  value={formData.hero_subtitle}
                  onChange={(e) => setFormData(prev => ({ ...prev, hero_subtitle: e.target.value }))}
                  className="form-textarea"
                  style={{ minHeight: '60px' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hero CTA Button Text</label>
                <input
                  type="text"
                  placeholder="Shop Catalog"
                  value={formData.hero_btn_text}
                  onChange={(e) => setFormData(prev => ({ ...prev, hero_btn_text: e.target.value }))}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Hero Button Link Destination</label>
                <input
                  type="text"
                  placeholder="e.g. #catalog-section or /category/covers"
                  value={formData.hero_btn_link}
                  onChange={(e) => setFormData(prev => ({ ...prev, hero_btn_link: e.target.value }))}
                  className="form-input"
                />
              </div>

              {/* Hero Image Upload */}
              <div className="form-group full-width" style={{ borderTop: '1px solid var(--border-color)', paddingTop: '20px' }}>
                <label className="form-label">Hero Banner Image</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{
                    width: '100%',
                    height: '180px',
                    borderRadius: 'var(--radius-lg)',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {heroPreview ? (
                      <img src={heroPreview} alt="Hero banner preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : heroBannerUrl ? (
                      <img src={heroBannerUrl} alt="Hero banner" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <div style={{ color: 'var(--text-muted)', textAlign: 'center' }}>
                        <ImageIcon size={28} style={{ display: 'block', margin: '0 auto 8px auto' }} />
                        <span>No banner configured. Default gradient active.</span>
                      </div>
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => heroInputRef.current?.click()}
                      className="admin-secondary-btn"
                      style={{ padding: '8px 16px', fontSize: '13px' }}
                    >
                      <Upload size={14} />
                      Upload Banner Image
                    </button>
                    <input
                      type="file"
                      ref={heroInputRef}
                      accept="image/*"
                      onChange={handleHeroFileChange}
                      style={{ display: 'none' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: PROMOTIONAL CARDS */}
          {activeTab === 'promo' && (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px', animation: 'fadeIn 0.25s ease-out' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', fontWeight: '700' }}>Side Promotional Cards</h3>
                <button
                  type="button"
                  onClick={handleAddPromoCard}
                  className="admin-primary-btn"
                  style={{ padding: '6px 12px', fontSize: '12px' }}
                >
                  <Plus size={14} />
                  Add Promo Card
                </button>
              </div>

              {promoCards.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                  <ImageIcon size={28} style={{ display: 'block', margin: '0 auto 8px auto' }} />
                  <span>No promotional cards added. Homepage banner will take full width.</span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {promoCards.map((card, idx) => (
                    <div 
                      key={card.id || idx} 
                      id={`promo-container-${card.id}`}
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border-color)',
                        borderRadius: 'var(--radius-md)',
                        padding: '16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '12px',
                        position: 'relative'
                      }}
                    >
                      {/* Top Action Bar */}
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                        <button
                          type="button"
                          disabled={idx === 0}
                          onClick={() => handleMoveCardUp(idx)}
                          className="admin-action-btn edit"
                          style={{ padding: '4px' }}
                          title="Move Up"
                        >
                          <ArrowUp size={14} />
                        </button>
                        <button
                          type="button"
                          disabled={idx === promoCards.length - 1}
                          onClick={() => handleMoveCardDown(idx)}
                          className="admin-action-btn edit"
                          style={{ padding: '4px' }}
                          title="Move Down"
                        >
                          <ArrowDown size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemovePromoCard(card.id)}
                          className="admin-action-btn delete"
                          style={{ padding: '4px', marginLeft: '8px' }}
                          title="Delete Card"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Fields grid */}
                      <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '10px' }}>Card Tag Sticker</label>
                          <input
                            type="text"
                            value={card.tag}
                            onChange={(e) => handlePromoCardChange(card.id, 'tag', e.target.value)}
                            placeholder="e.g. Featured, Hot Deal"
                            className="form-input"
                            style={{ padding: '8px', fontSize: '13px' }}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '10px' }}>Card Title</label>
                          <input
                            type="text"
                            value={card.title}
                            onChange={(e) => handlePromoCardChange(card.id, 'title', e.target.value)}
                            placeholder="e.g. Premium Matte Covers"
                            className="form-input"
                            style={{ padding: '8px', fontSize: '13px' }}
                          />
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                          <label className="form-label" style={{ fontSize: '10px' }}>Description / Subtitle</label>
                          <input
                            type="text"
                            value={card.subtitle}
                            onChange={(e) => handlePromoCardChange(card.id, 'subtitle', e.target.value)}
                            placeholder="e.g. Sleek, wireless-charging compatible..."
                            className="form-input"
                            style={{ padding: '8px', fontSize: '13px' }}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '10px' }}>Button Text</label>
                          <input
                            type="text"
                            value={card.btn_text}
                            onChange={(e) => handlePromoCardChange(card.id, 'btn_text', e.target.value)}
                            placeholder="e.g. Explore Covers"
                            className="form-input"
                            style={{ padding: '8px', fontSize: '13px' }}
                          />
                        </div>

                        <div className="form-group">
                          <label className="form-label" style={{ fontSize: '10px' }}>Button Target URL</label>
                          <input
                            type="text"
                            value={card.btn_link}
                            onChange={(e) => handlePromoCardChange(card.id, 'btn_link', e.target.value)}
                            placeholder="e.g. /category/covers"
                            className="form-input"
                            style={{ padding: '8px', fontSize: '13px' }}
                          />
                        </div>

                        {/* Toggles */}
                        <div style={{ display: 'flex', gap: '20px', gridColumn: 'span 2', marginTop: '4px' }}>
                          <label className="form-checkbox-group">
                            <input
                              type="checkbox"
                              checked={card.is_active}
                              onChange={(e) => handlePromoCardChange(card.id, 'is_active', e.target.checked)}
                              className="form-checkbox"
                            />
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>Active (Show Card)</span>
                          </label>

                          <label className="form-checkbox-group">
                            <input
                              type="checkbox"
                              checked={card.is_dark}
                              onChange={(e) => handlePromoCardChange(card.id, 'is_dark', e.target.checked)}
                              className="form-checkbox"
                            />
                            <span style={{ fontSize: '12px', fontWeight: '600' }}>Dark Color Theme</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: HOMEPAGE BUILDER */}
          {activeTab === 'builder' && (
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '30px', animation: 'fadeIn 0.25s ease-out' }}>
              
              {/* Homepage Dynamic Sections */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <h3 style={{ fontSize: '16px', fontWeight: '700' }}>Homepage Dynamic Sections</h3>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      Add, delete, reorder, and configure custom product collections or category cards
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddSection}
                    className="admin-primary-btn"
                    style={{ padding: '6px 12px', fontSize: '12px' }}
                  >
                    <Plus size={14} />
                    Add New Section
                  </button>
                </div>

                {sections.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    <span>No landing sections configured. Click "Add New Section" to start building.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {sections.map((section, idx) => (
                      <div 
                        key={section.id || idx} 
                        id={`section-container-${section.id}`}
                        style={{
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border-color)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '12px',
                          position: 'relative'
                        }}
                      >
                        {/* Section actions bar */}
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                          <button
                            type="button"
                            disabled={idx === 0}
                            onClick={() => handleMoveSectionUp(idx)}
                            className="admin-action-btn edit"
                            style={{ padding: '4px' }}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={idx === sections.length - 1}
                            onClick={() => handleMoveSectionDown(idx)}
                            className="admin-action-btn edit"
                            style={{ padding: '4px' }}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveSection(section.id)}
                            className="admin-action-btn delete"
                            style={{ padding: '4px', marginLeft: '8px' }}
                            title="Delete Section"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                         {/* Fields grid */}
                        <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '11px' }}>Section Title / Heading</label>
                            <input
                              type="text"
                              value={section.title}
                              onChange={(e) => handleSectionChange(section.id, 'title', e.target.value)}
                              placeholder="e.g. ✨ New Arrivals"
                              className="form-input"
                              style={{ padding: '8px', fontSize: '13px' }}
                            />
                          </div>

                          <div className="form-group">
                            <label className="form-label" style={{ fontSize: '11px' }}>Section Content Type</label>
                            <select
                              value={section.type || 'products'}
                              onChange={(e) => handleSectionChange(section.id, 'type', e.target.value)}
                              className="form-input"
                              style={{ padding: '8px', fontSize: '13px' }}
                            >
                              <option value="products">Products List Grid</option>
                              <option value="categories">Explore Categories Grid</option>
                            </select>
                          </div>

                          {section.type !== 'categories' && (
                            <>
                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '11px' }}>Products Source Mode</label>
                                <select
                                  value={section.mode || 'auto'}
                                  onChange={(e) => handleSectionChange(section.id, 'mode', e.target.value)}
                                  className="form-input"
                                  style={{ padding: '8px', fontSize: '13px' }}
                                >
                                  <option value="auto">Automatic (Featured / Newest / Catalog)</option>
                                  <option value="manual">Manual Product Selection</option>
                                </select>
                              </div>

                              <div className="form-group">
                                <label className="form-label" style={{ fontSize: '11px' }}>Max Display Products (Before "View All")</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={section.limit ?? ''}
                                  onChange={(e) => handleSectionChange(section.id, 'limit', e.target.value === '' ? '' : Number(e.target.value))}
                                  className="form-input"
                                  style={{ padding: '8px', fontSize: '13px' }}
                                />
                              </div>
                            </>
                          )}

                          {/* Visibility Checkbox */}
                          <div style={{ display: 'flex', gap: '20px', gridColumn: 'span 2', marginTop: '4px' }}>
                            <label className="form-checkbox-group">
                              <input
                                type="checkbox"
                                checked={section.enabled ?? true}
                                onChange={(e) => handleSectionChange(section.id, 'enabled', e.target.checked)}
                                className="form-checkbox"
                              />
                              <span style={{ fontSize: '12px', fontWeight: '600' }}>Enabled (Show Section)</span>
                            </label>
                          </div>
                        </div>

                        {/* Manual Products Selector */}
                        {section.type !== 'categories' && section.mode === 'manual' && (
                          <div style={{ marginTop: '12px', borderTop: '1px dashed var(--border-color)', paddingTop: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '10px' }}>
                              <label className="form-label" style={{ fontSize: '11px', fontWeight: '700', margin: 0 }}>Selected Section Products ({section.productIds?.length || 0})</label>
                              <button
                                type="button"
                                onClick={() => setActiveSelectorSectionId(section.id)}
                                className="admin-primary-btn"
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              >
                                <Plus size={14} />
                                Add Products
                              </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {(section.productIds || [])
                                .slice(0, expandedSections[section.id] ? undefined : 4)
                                .map((pId, pIdx) => {
                                  const product = productsList.find(p => p.id === pId);
                                  return (
                                    <div 
                                      key={pId}
                                      draggable
                                      onDragStart={(e) => handleDragStart(e, pIdx, section.id)}
                                      onDragOver={handleDragOver}
                                      onDrop={(e) => handleDrop(e, pIdx, section.id)}
                                      data-drag-type="product-item"
                                      data-section-id={section.id}
                                      data-index={pIdx}
                                      onTouchStart={(e) => handleTouchStart(e, pIdx, section.id)}
                                      onTouchMove={handleTouchMove}
                                      onTouchEnd={handleTouchEnd}
                                      style={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'space-between', 
                                        background: 'var(--bg-primary)', 
                                        padding: '8px 12px', 
                                        borderRadius: 'var(--radius-sm)', 
                                        border: '1px solid var(--border-color)', 
                                        fontSize: '13px',
                                        cursor: 'grab'
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <button
                                          type="button"
                                          disabled={pIdx === 0}
                                          onClick={() => handleMoveProductUp(section.id, pIdx)}
                                          style={{ 
                                            background: 'transparent', 
                                            color: pIdx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                                            padding: '4px',
                                            cursor: pIdx === 0 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                          title="Move Up"
                                        >
                                          <ArrowUp size={14} />
                                        </button>
                                        <button
                                          type="button"
                                          disabled={pIdx === (section.productIds || []).length - 1}
                                          onClick={() => handleMoveProductDown(section.id, pIdx, (section.productIds || []).length)}
                                          style={{ 
                                            background: 'transparent', 
                                            color: pIdx === (section.productIds || []).length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                                            padding: '4px',
                                            cursor: pIdx === (section.productIds || []).length - 1 ? 'not-allowed' : 'pointer',
                                            display: 'flex',
                                            alignItems: 'center'
                                          }}
                                          title="Move Down"
                                        >
                                          <ArrowDown size={14} />
                                        </button>
                                        <span style={{ marginLeft: '4px' }}>{product ? product.name : 'Unknown Product'}</span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleSectionProductRemove(section.id, pId)}
                                        style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', background: 'transparent' }}
                                        title="Remove product"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  );
                                })}
                              {(!section.productIds || section.productIds.length === 0) && (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No products selected yet. Click the select button above.</span>
                              )}
                              {section.productIds && section.productIds.length > 4 && (
                                <button
                                  type="button"
                                  onClick={() => toggleSectionExpanded(section.id)}
                                  className="admin-secondary-btn"
                                  style={{ 
                                    padding: '6px 12px', 
                                    fontSize: '12px', 
                                    marginTop: '6px',
                                    alignSelf: 'flex-start',
                                    border: '1px solid var(--border-color)',
                                    borderRadius: 'var(--radius-sm)',
                                    background: 'var(--bg-primary)',
                                    color: 'var(--text-primary)',
                                    cursor: 'pointer'
                                  }}
                                >
                                  {expandedSections[section.id] ? 'Show Less' : `Show More (${section.productIds.length - 4} more)`}
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Explore Categories Settings */}
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '24px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Explore Categories Block</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Enable and customize the dedicated Category navigation grid before the footer checkout CTA
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '4px' }}>
                    <label className="form-checkbox-group">
                      <input
                        type="checkbox"
                        checked={formData.categories_section_enabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, categories_section_enabled: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Enable Explore Categories Section</span>
                    </label>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categories Section Title</label>
                    <input
                      type="text"
                      placeholder="Explore Categories"
                      value={formData.categories_section_title}
                      onChange={(e) => setFormData(prev => ({ ...prev, categories_section_title: e.target.value }))}
                      disabled={!formData.categories_section_enabled}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              {/* WhatsApp Checkout CTA Settings */}
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '4px' }}>Custom Accessories WhatsApp CTA</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                  Configure the landing page banner inviting customers to chat for custom orders
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', gap: '20px', marginBottom: '4px' }}>
                    <label className="form-checkbox-group">
                      <input
                        type="checkbox"
                        checked={formData.cta_enabled}
                        onChange={(e) => setFormData(prev => ({ ...prev, cta_enabled: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span style={{ fontSize: '13px', fontWeight: '600' }}>Enable WhatsApp CTA Banner</span>
                    </label>
                  </div>

                  <div className="admin-form-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                    <div className="form-group">
                      <label className="form-label">CTA Section Title</label>
                      <input
                        type="text"
                        placeholder="Need Custom Mobile Accessories?"
                        value={formData.cta_title}
                        onChange={(e) => setFormData(prev => ({ ...prev, cta_title: e.target.value }))}
                        disabled={!formData.cta_enabled}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label className="form-label">CTA Button Label</label>
                      <input
                        type="text"
                        placeholder="Chat with Shop Owner"
                        value={formData.cta_btn_text}
                        onChange={(e) => setFormData(prev => ({ ...prev, cta_btn_text: e.target.value }))}
                        disabled={!formData.cta_enabled}
                        className="form-input"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">CTA Message Description</label>
                      <textarea
                        placeholder="Description telling customers to connect for models not listed..."
                        value={formData.cta_description}
                        onChange={(e) => setFormData(prev => ({ ...prev, cta_description: e.target.value }))}
                        disabled={!formData.cta_enabled}
                        className="form-textarea"
                        style={{ minHeight: '60px' }}
                      />
                    </div>

                    <div className="form-group full-width">
                      <label className="form-label">Default WhatsApp Pre-filled Message</label>
                      <input
                        type="text"
                        placeholder={`e.g. Hello ${shopSettings?.shop_name || "MahaMaya Mobiles"}, I have a query about a phone accessory.`}
                        value={formData.cta_whatsapp_text}
                        onChange={(e) => setFormData(prev => ({ ...prev, cta_whatsapp_text: e.target.value }))}
                        disabled={!formData.cta_enabled}
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* Form Footer */}
          <div className="form-footer">
            <button
              type="submit"
              disabled={saving}
              className="admin-primary-btn"
              style={{ padding: '12px 24px', borderRadius: 'var(--radius-md)' }}
            >
              {saving ? (
                <>
                  <RefreshCw size={16} style={{ animation: 'spin 1.5s linear infinite' }} />
                  Saving Website Content...
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Content Changes
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Select Products Panel Overlay Modal */}
      {activeSelectorSectionId && activeSection && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content admin-products-selector-modal" style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            overflow: 'hidden',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            animation: 'scaleIn var(--transition-normal) forwards'
          }}>
            {/* Header */}
            <div style={{ 
              padding: '16px 24px', 
              borderBottom: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              background: 'var(--bg-secondary)'
            }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800' }}>Add Products</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setActiveSelectorSectionId(null)}
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)', 
                  borderRadius: 'var(--radius-full)', 
                  padding: '6px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  color: 'var(--text-secondary)'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Split Content Area */}
            <div className="admin-modal-split-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', flex: 1, overflow: 'hidden' }}>
              
              {/* Left Column: Selected Products (Drag & Drop Reordering) */}
              <div style={{ display: 'flex', flexDirection: 'column', borderRight: '1px solid var(--border-color)', overflow: 'hidden', padding: '16px', background: 'var(--bg-secondary)' }}>
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {((activeSection.productIds || []).slice(0, expandedSelectorSelected ? undefined : 4)).map((pId, pIdx) => {
                    const product = productsList.find(p => String(p.id) === String(pId));
                    return (
                      <div 
                        key={pId}
                        draggable
                        onDragStart={(e) => handleDragStart(e, pIdx, activeSection.id)}
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, pIdx, activeSection.id)}
                        data-drag-type="product-item"
                        data-section-id={activeSection.id}
                        data-index={pIdx}
                        onTouchStart={(e) => handleTouchStart(e, pIdx, activeSection.id)}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'space-between', 
                          background: 'var(--bg-primary)', 
                          padding: '10px 12px', 
                          borderRadius: 'var(--radius-md)', 
                          border: '1px solid var(--border-color)', 
                          fontSize: '13px',
                          cursor: 'grab',
                          boxShadow: 'var(--shadow-sm)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            disabled={pIdx === 0}
                            onClick={() => handleMoveProductUp(activeSection.id, pIdx)}
                            style={{ 
                              background: 'transparent', 
                              color: pIdx === 0 ? 'var(--text-muted)' : 'var(--text-primary)',
                              padding: '4px',
                              cursor: pIdx === 0 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Move Up"
                          >
                            <ArrowUp size={14} />
                          </button>
                          <button
                            type="button"
                            disabled={pIdx === (activeSection.productIds || []).length - 1}
                            onClick={() => handleMoveProductDown(activeSection.id, pIdx, (activeSection.productIds || []).length)}
                            style={{ 
                              background: 'transparent', 
                              color: pIdx === (activeSection.productIds || []).length - 1 ? 'var(--text-muted)' : 'var(--text-primary)',
                              padding: '4px',
                              cursor: pIdx === (activeSection.productIds || []).length - 1 ? 'not-allowed' : 'pointer',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="Move Down"
                          >
                            <ArrowDown size={14} />
                          </button>
                          <span style={{ fontWeight: '500', marginLeft: '4px' }}>{product ? product.name : 'Unknown Product'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleSectionProductRemove(activeSection.id, pId)}
                          style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', background: 'transparent' }}
                          title="Remove product"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    );
                  })}
                  {(!activeSection.productIds || activeSection.productIds.length === 0) && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>No products selected yet. Add from the right.</span>
                  )}
                </div>
                {activeSection.productIds && activeSection.productIds.length > 4 && (
                  <div style={{ padding: '8px 0 0 0', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                    <button
                      type="button"
                      onClick={() => setExpandedSelectorSelected(!expandedSelectorSelected)}
                      className="admin-secondary-btn"
                      style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '6px 12px' }}
                    >
                      {expandedSelectorSelected ? 'Show Less' : `Show More (${activeSection.productIds.length - 4} more)`}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: All Products Catalog with Filters */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: '16px' }}>
                {/* Filters Row */}
                <div className="admin-quick-actions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
                  <div className="form-group" style={{ margin: 0, gap: '4px' }}>
                    <label className="form-label" style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Category</label>
                    <select
                      value={filters[activeSelectorSectionId]?.category || ''}
                      onChange={(e) => handleFilterChange(activeSelectorSectionId, 'category', e.target.value)}
                      className="form-input"
                      style={{ padding: '6px 8px', fontSize: '12px', height: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
                    >
                      <option value="">All Categories</option>
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-group" style={{ margin: 0, gap: '4px' }}>
                    <label className="form-label" style={{ fontSize: '9px', color: 'var(--text-secondary)' }}>Search</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="text"
                        placeholder="Search by name..."
                        value={filters[activeSelectorSectionId]?.search || ''}
                        onChange={(e) => handleFilterChange(activeSelectorSectionId, 'search', e.target.value)}
                        className="form-input"
                        style={{ padding: '6px 24px 6px 8px', fontSize: '12px', height: '32px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', width: '100%' }}
                      />
                      {filters[activeSelectorSectionId]?.search && (
                        <button
                          type="button"
                          onClick={() => handleFilterChange(activeSelectorSectionId, 'search', '')}
                          style={{ position: 'absolute', right: '6px', color: 'var(--text-secondary)', background: 'transparent', display: 'flex', alignItems: 'center' }}
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Catalog List */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', paddingRight: '4px' }}>
                  {(() => {
                    const filteredCatalog = productsList.filter(p => {
                      const isAdded = (activeSection.productIds || []).some(id => String(id) === String(p.id));
                      if (isAdded) return false;

                      const secFilters = filters[activeSelectorSectionId] || { category: '', search: '' };
                      if (secFilters.category && p.category_id !== secFilters.category) return false;
                      if (secFilters.search && !p.name.toLowerCase().includes(secFilters.search.toLowerCase())) return false;
                      return true;
                    });
                    
                    const slicedCatalog = expandedSelectorCatalog ? filteredCatalog : filteredCatalog.slice(0, 4);
                    
                    return (
                      <>
                        {slicedCatalog.map(product => (
                          <div 
                            key={product.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '10px 12px',
                              background: 'var(--bg-primary)',
                              border: '1px solid var(--border-color)',
                              borderRadius: 'var(--radius-md)',
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{product.name}</span>
                            <button
                              type="button"
                              onClick={() => handleSectionProductAdd(activeSection.id, product.id)}
                              className="admin-primary-btn"
                              style={{ 
                                padding: '4px 10px', 
                                fontSize: '11px',
                                borderRadius: 'var(--radius-full)',
                                background: 'var(--bg-dark)',
                                color: 'var(--text-light)',
                                border: 'none'
                              }}
                            >
                              Add
                            </button>
                          </div>
                        ))}
                        {filteredCatalog.length > 4 && (
                          <div style={{ padding: '8px 0 0 0', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'center', marginTop: '4px' }}>
                            <button
                              type="button"
                              onClick={() => setExpandedSelectorCatalog(!expandedSelectorCatalog)}
                              className="admin-secondary-btn"
                              style={{ width: '100%', justifyContent: 'center', fontSize: '12px', padding: '6px 12px' }}
                            >
                              {expandedSelectorCatalog ? 'Show Less' : `Show More (${filteredCatalog.length - 4} more)`}
                            </button>
                          </div>
                        )}
                        {filteredCatalog.length === 0 && (
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No products found.</span>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* Footer / Go Back Option */}
            <div style={{ 
              padding: '16px 24px', 
              borderTop: '1px solid var(--border-color)', 
              display: 'flex', 
              justifyContent: 'flex-end',
              background: 'var(--bg-secondary)'
            }}>
              <button 
                type="button"
                onClick={() => setActiveSelectorSectionId(null)}
                className="admin-primary-btn"
                style={{ padding: '10px 24px', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Go Back & Save Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Icon Picker Overlay Modal */}
      {activeIconPickerLinkId && (
        <div className="modal-overlay" style={{ zIndex: 1200 }} onClick={() => setActiveIconPickerLinkId(null)}>
          <div className="modal-content" style={{ 
            maxWidth: '450px', 
            padding: '24px', 
            background: 'var(--bg-primary)', 
            borderRadius: 'var(--radius-lg)',
            display: 'block'
          }} onClick={(e) => e.stopPropagation()}>
            
            <button onClick={() => setActiveIconPickerLinkId(null)} className="modal-close-btn" aria-label="Close modal">
              <X size={20} />
            </button>
            
            <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '16px', color: 'var(--text-primary)' }}>Choose Icon</h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '12px',
              maxHeight: '300px',
              overflowY: 'auto',
              paddingRight: '4px'
            }}>
              {BUILTIN_ICONS.map((icon) => (
                <button
                  key={icon.key}
                  type="button"
                  onClick={() => {
                    handleSocialLinkChange(activeIconPickerLinkId, 'icon_key', icon.key);
                    setActiveIconPickerLinkId(null);
                  }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '10px',
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-md)',
                    cursor: 'pointer',
                    color: 'var(--text-primary)',
                    transition: 'all 0.15s ease'
                  }}
                  className="icon-picker-btn"
                >
                  <SocialIcon iconKey={icon.key} size={20} />
                  <span style={{ fontSize: '10px', fontWeight: '500', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{icon.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
