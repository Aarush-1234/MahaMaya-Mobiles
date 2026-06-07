'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Mail, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';
import SocialIcon from './SocialIcon';

export default function Footer() {
  const { settings, categories, socialLinks } = useShop();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: About */}
          <div className="footer-about">
            {settings.logo_url ? (
              <img
                src={settings.logo_url}
                alt={settings.shop_name || 'Logo'}
                className="logo-img"
                style={{
                  width: '100%',
                  maxWidth: '160px',
                  height: 'auto',
                  maxHeight: '60px',
                  objectFit: 'contain',
                  display: 'block',
                  marginBottom: '16px'
                }}
              />
            ) : (
              <h3 className="footer-about-title">
                {settings.shop_name ? (
                  settings.shop_name
                ) : (
                  <>COVERS<span style={{ color: 'var(--accent-yellow)' }}>ZONE</span></>
                )}
              </h3>
            )}
            <p className="footer-desc">
              {settings.footer_description}
            </p>
          </div>

          {/* Column 2: Categories */}
          <div className="footer-nav">
            <h4 className="footer-title">Categories</h4>
            <ul className="footer-links">
              <li>
                <Link href="/">All Products</Link>
              </li>
              {categories.slice(0, 5).map((category) => (
                <li key={category.id}>
                  <Link href={`/category/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div className="footer-contact">
            <h4 className="footer-title">Contact & Shop</h4>
            <div className="footer-info-item">
              <MapPin size={16} />
              <span>{settings.address || 'Address not configured'}</span>
            </div>
            <div className="footer-info-item">
              <Phone size={16} />
              <span>+{settings.whatsapp_number}</span>
            </div>
            {settings.email && (
              <div className="footer-info-item">
                <Mail size={16} />
                <span>{settings.email}</span>
              </div>
            )}
            <div className="footer-info-item">
              <ShieldCheck size={16} />
              <span>Official Retail Store</span>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="footer-bottom">
          <p>{settings.footer_copyright}</p>
          {socialLinks && socialLinks.filter(l => l.is_active && l.url && l.url.trim() !== '').length > 0 && (
            <div className="footer-social-links">
              {socialLinks
                .filter(l => l.is_active && l.url && l.url.trim() !== '')
                .map((link) => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={link.label || link.icon_key}
                    className="footer-social-icon-link"
                    title={link.label}
                  >
                    <SocialIcon iconKey={link.icon_key} size={18} />
                  </a>
                ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
