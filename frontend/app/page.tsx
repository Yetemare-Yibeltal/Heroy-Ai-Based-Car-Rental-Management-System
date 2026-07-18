import { InteractiveBackground } from '@/components/three/InteractiveBackground';
import { Hero3D } from '@/components/home/Hero3D';
import { FeaturedFleet } from '@/components/home/FeaturedFleet';
import { Testimonials } from '@/components/home/Testimonials';

export default function HomePage() {
  return (
    <>
      <InteractiveBackground />
      <Hero3D />
      <FeaturedFleet />
      <Testimonials />
    </>
  );
}