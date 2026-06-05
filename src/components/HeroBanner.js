'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function HeroBanner() {
  const { settings } = useShop();
  const router = useRouter();

  const handleHeroClick = () => {
    const link = settings.hero_btn_link || '#catalog-section';
    if (link.startsWith('#')) {
      const element = document.getElementById(link.substring(1)) || document.getElementById('catalog-section');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.push(link);
    }
  };

  const bannerBgStyle = settings.hero_banner_url
    ? {
        '--hero-image': `url(${settings.hero_banner_url})`
      }
    : {};

  const activePromoCards = settings.promo_cards?.filter(card => card.is_active) || [];

  return (
    <div className="hero-grid" style={{ gridTemplateColumns: activePromoCards.length === 0 ? '1fr' : undefined }}>
      {/* Main Hero Banner */}
      <div className={`hero-main-banner ${settings.hero_banner_url ? 'has-bg' : ''}`} style={bannerBgStyle}>
        <div className="hero-tag">
          <Sparkles size={12} style={{ marginRight: '4px', display: 'inline' }} />
          {settings.header_tagline || 'Premium Accessories'}
        </div>
        <h1 className="hero-title">
          {settings.hero_title}
        </h1>
        <p className="hero-subtitle">
          {settings.hero_subtitle}
        </p>
        <button onClick={handleHeroClick} className="hero-btn">
          {settings.hero_btn_text}
        </button>
      </div>

      {/* Side Promotional Cards */}
      {activePromoCards.length > 0 && (
        <div className="hero-side-banners">
          {activePromoCards.map((card, idx) => (
            <div key={card.id || idx} className={`hero-promo-card ${card.is_dark ? 'dark' : ''}`}>
              <div>
                <span className="promo-tag" style={{ color: card.is_dark ? undefined : 'var(--text-primary)' }}>{card.tag}</span>
                <h2 className="promo-title" style={{ marginTop: '8px', color: card.is_dark ? undefined : 'var(--text-primary)' }}>
                  {card.title}
                </h2>
                <p style={{ fontSize: '13px', color: card.is_dark ? 'var(--text-muted)' : 'var(--text-secondary)', marginTop: '8px' }}>
                  {card.subtitle}
                </p>
              </div>
              <button 
                onClick={() => router.push(card.btn_link)}
                className="promo-link" 
                style={{ color: card.is_dark ? 'var(--accent-yellow)' : 'var(--text-primary)' }}
              >
                {card.btn_text} <ArrowRight size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
