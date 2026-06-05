import React, { Suspense } from 'react';
import CategoryClient from '../../../components/CategoryClient';

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  return (
    <Suspense fallback={
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-secondary)' }}>
        <p>Loading category...</p>
      </div>
    }>
      <CategoryClient slug={slug} />
    </Suspense>
  );
}
