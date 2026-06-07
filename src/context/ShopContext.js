'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const ShopContext = createContext();

const defaultExtraSettings = {
  announcement_text: '✨ Free Shipping on Orders Above ₹499! Order directly on WhatsApp.',
  announcement_enabled: true,
  header_tagline: 'Premium Mobile Accessories Store',
  footer_description: 'Your one-stop destination for premium mobile accessories. We specialize in durable mobile covers, tempered glass, fast chargers, and top-tier Bluetooth sound accessories.',
  footer_copyright: `© ${new Date().getFullYear()} MahaMaya Mobiles. All rights reserved.`,
  ordering_guidelines: 'Add items to your cart, fill in delivery details, and click checkout to send your order directly to us via WhatsApp.',
  hero_title: "Elevate Your Phone's Protection & Style",
  hero_subtitle: "Explore premium covers, military-grade tempered glass, and high-speed charging accessories curated for your devices.",
  hero_btn_text: "Shop Catalog",
  hero_btn_link: "#catalog-section",
  promo_cards: [
    {
      id: 'promo-1',
      tag: 'Featured',
      title: 'Premium Matte Covers',
      subtitle: 'Sleek, scratch-resistant, and wireless-charging compatible.',
      btn_text: 'Explore Covers',
      btn_link: '/category/covers',
      is_dark: true,
      is_active: true
    },
    {
      id: 'promo-2',
      tag: 'Deal of the Week',
      title: 'Super Fast Chargers',
      subtitle: 'Up to 65W power delivery for iPhone & Samsung devices.',
      btn_text: 'Shop Power',
      btn_link: '/category/chargers',
      is_dark: false,
      is_active: true
    }
  ],
  sections: [
    {
      id: 'featured',
      title: '⚡ Best Sellers & Featured',
      enabled: true,
      mode: 'auto',
      productIds: [],
      limit: 8
    },
    {
      id: 'arrivals',
      title: '✨ New Arrivals',
      enabled: true,
      mode: 'auto',
      productIds: [],
      limit: 8
    },
    {
      id: 'catalog',
      title: '📦 Explore All Accessories',
      enabled: true,
      mode: 'auto',
      productIds: [],
      limit: 8
    }
  ],
  categories_section_title: 'Explore Categories',
  categories_section_enabled: true,
  cta_title: 'Need Custom Mobile Accessories?',
  cta_description: "Can't find your specific phone model or cover style? Connect with us on WhatsApp! Send us a photo or query, and we'll check stock directly.",
  cta_btn_text: 'Chat with Shop Owner',
  cta_enabled: true,
  cta_whatsapp_text: 'Hello MahaMaya Mobiles, I have a query about a phone accessory.'
};

export const parseSettings = (dbRow) => {
  const shopName = dbRow?.shop_name || 'MahaMaya Mobiles';
  let extra = {
    ...defaultExtraSettings,
    footer_copyright: `© ${new Date().getFullYear()} ${shopName}. All rights reserved.`,
    cta_whatsapp_text: `Hello ${shopName}, I have a query about a phone accessory.`
  };

  if (!dbRow) return {
    shop_name: 'MahaMaya Mobiles',
    whatsapp_number: '919796628335',
    email: '',
    address: '',
    logo_url: null,
    hero_banner_url: null,
    ...extra
  };
  
  let addressText = dbRow.address || '';

  try {
    if (dbRow.address && dbRow.address.trim().startsWith('{') && dbRow.address.trim().endsWith('}')) {
      const parsed = JSON.parse(dbRow.address);
      addressText = parsed.address || '';
      extra = {
        ...extra,
        ...parsed
      };
    }
  } catch (e) {
    console.error('Failed to parse settings JSON from address field:', e);
  }

  // Clean up any remaining "COVERS ZONE" from settings configuration
  Object.keys(extra).forEach(key => {
    if (typeof extra[key] === 'string') {
      extra[key] = extra[key].replace(/COVERS ZONE/gi, shopName);
    }
  });

  return {
    ...dbRow,
    address: addressText,
    ...extra
  };
};

export function ShopProvider({ children }) {
  const [settings, setSettings] = useState(parseSettings(null));
  const [categories, setCategories] = useState([]);
  const [deviceBrands, setDeviceBrands] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [products, setProducts] = useState([]);
  const [socialLinks, setSocialLinks] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const fetchShopData = async () => {
    try {
      setIsLoading(true);
      setProductsLoading(true);
      
      // 1. Fetch settings
      const { data: settingsData, error: settingsError } = await supabase
        .from('settings')
        .select('*')
        .limit(1);
      
      if (!settingsError && settingsData && settingsData.length > 0) {
        const parsed = parseSettings(settingsData[0]);
        setSettings(parsed);
        try {
          localStorage.setItem('shop_settings', JSON.stringify(settingsData[0]));
        } catch (e) {
          console.error('Failed to cache settings in localStorage:', e);
        }
      } else {
        setSettings(parseSettings(null));
      }

      // 2. Fetch active categories ordered by display_order
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!categoriesError && categoriesData) {
        setCategories(categoriesData);
      }

      // 3. Fetch active device brands
      const { data: brandsData, error: brandsError } = await supabase
        .from('device_brands')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!brandsError && brandsData) {
        setDeviceBrands(brandsData);
      }

      // 4. Fetch active device models
      const { data: modelsData, error: modelsError } = await supabase
        .from('device_models')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });
      
      if (!modelsError && modelsData) {
        setDeviceModels(modelsData);
      }

      // 5. Fetch all products with categories, images, tags, and compatible devices
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          *,
          categories (id, name, slug),
          images: product_images (*),
          tags: product_tags (*),
          product_device_models (
            device_model_id,
            device_models (
              id,
              name,
              slug,
              brand_id,
              device_brands (id, name, slug)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (!productsError && productsData) {
        setProducts(productsData);
      }

      // 6. Fetch social links ordered by display_order
      const { data: socialLinksData, error: socialLinksError } = await supabase
        .from('social_links')
        .select('*')
        .order('display_order', { ascending: true });
      
      if (!socialLinksError && socialLinksData) {
        setSocialLinks(socialLinksData);
      } else if (socialLinksError) {
        console.error('Error fetching social links in ShopContext:', {
          message: socialLinksError.message,
          details: socialLinksError.details,
          hint: socialLinksError.hint,
          code: socialLinksError.code
        });
      }

    } catch (err) {
      console.error('Error fetching shop data from Supabase:', err);
    } finally {
      setIsLoading(false);
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    const cached = localStorage.getItem('shop_settings');
    if (cached) {
      try {
        setSettings(parseSettings(JSON.parse(cached)));
      } catch (e) {
        console.error('Failed to parse cached settings:', e);
      }
    }
    fetchShopData();
  }, []);

  return (
    <ShopContext.Provider
      value={{
        settings,
        categories,
        deviceBrands,
        deviceModels,
        products,
        productsLoading,
        socialLinks,
        isLoading,
        refreshShopData: fetchShopData
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  const context = useContext(ShopContext);
  if (!context) {
    throw new Error('useShop must be used within a ShopProvider');
  }
  return context;
}
