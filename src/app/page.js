import React, { Suspense } from 'react';
import HomeClient from '../components/HomeClient';

export default function HomePage() {
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <p>Loading...</p>
      </div>
    }>
      <HomeClient />
    </Suspense>
  );
}
