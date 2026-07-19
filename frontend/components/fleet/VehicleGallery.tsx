'use client';

import { useState } from 'react';
import { Car } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VehicleImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

interface VehicleGalleryProps {
  images: VehicleImage[];
  vehicleName: string;
}

export function VehicleGallery({ images, vehicleName }: VehicleGalleryProps) {
  const sortedImages = [...images].sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0));
  const [activeIndex, setActiveIndex] = useState(0);

  if (sortedImages.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center rounded-lg bg-gradient-to-br from-secondary to-secondary/40 sm:h-96">
        <Car size={64} className="text-muted-foreground/40" />
      </div>
    );
  }

  const activeImage = sortedImages[activeIndex] ?? sortedImages[0];

  return (
    <div>
      <div className="h-80 overflow-hidden rounded-lg bg-secondary sm:h-96">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage.url}
          alt={vehicleName}
          className="h-full w-full object-cover transition-opacity duration-300"
        />
      </div>

      {sortedImages.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActiveIndex(index)}
              className={cn(
                'h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition-colors',
                index === activeIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}