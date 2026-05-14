"use client";
import { Suspense } from 'react';
import Summary from '@/src/views/Summary';

export default function Page() { 
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Summary />
    </Suspense>
  ); 
}
