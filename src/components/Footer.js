'use client';

import React from 'react';
import Link from 'next/link';
import { Phone, MapPin, Mail, ShieldCheck } from 'lucide-react';
import { useShop } from '../context/ShopContext';

export default function Footer() {
  const { settings, categories } = useShop();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          {/* Column 1: About */}
          <div className="footer-about">
            <h3 className="footer-about-title">
              COVERS<span style={{ color: 'var(--accent-yellow)' }}>ZONE</span>
            </h3>
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
        </div>
      </div>
    </footer>
  );
}
