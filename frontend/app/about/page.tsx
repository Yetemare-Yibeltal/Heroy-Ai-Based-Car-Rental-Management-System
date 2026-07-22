import { Search, FileCheck, CreditCard, Car } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { GradientText } from '@/components/ui/GradientText';

const STEPS = [
  {
    icon: Search,
    title: 'Browse & quote',
    description:
      'Search the live fleet by category, price, or seats, and get an instant, real price quote including any add-ons and tax.',
  },
  {
    icon: FileCheck,
    title: 'Verify your license',
    description:
      'Submit your driver\'s license or ID once - after approval, you can book any vehicle without resubmitting.',
  },
  {
    icon: CreditCard,
    title: 'Book & pay',
    description:
      'Reserve your vehicle and pay securely with a card, or with Telebirr, CBE Birr, or HelloCash.',
  },
  {
    icon: Car,
    title: 'Pick up & drive',
    description:
      'Collect your vehicle at your chosen branch, or have it delivered - either way, you\'re on the road.',
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-16 text-center">
        <GradientText as="h1" className="text-3xl sm:text-4xl">
          About HEROY
        </GradientText>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          HEROY started with a simple idea: renting a car shouldn't require standing in line or
          waiting on hold. We built a platform where you can browse a real fleet, get a real price,
          and book a real vehicle - with an AI assistant that can help at every step, including
          completing the booking itself.
        </p>
      </div>

      <h2 className="mb-8 text-center font-display text-2xl font-bold">How it works</h2>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {STEPS.map((step, index) => (
          <GlassPanel key={step.title} className="p-6">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 font-mono text-sm font-bold text-primary">
                {index + 1}
              </div>
              <step.icon size={20} className="text-primary" />
            </div>
            <h3 className="font-display text-lg font-semibold">{step.title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}