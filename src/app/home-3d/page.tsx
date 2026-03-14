'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';

// Dynamic import to avoid SSR issues with Three.js
const HouseScene = dynamic(() => import('@/components/house3d/Scene'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen bg-[#050510] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4 animate-pulse">🛸</div>
        <p className="text-white/30 text-sm">Preparing landing...</p>
      </div>
    </div>
  ),
});

export default function Home3DPage() {
  const router = useRouter();

  const handleNavigate = (url: string) => {
    if (url === '/') {
      router.push('/');
    } else if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      router.push(url);
    }
  };

  return <HouseScene onNavigate={handleNavigate} />;
}
