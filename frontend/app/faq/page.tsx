import { ChevronDown } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel';
import { AnimatedText } from '@/components/ui/AnimatedText';

export const metadata = {
  title: 'FAQ',
};

const FAQS = [
  {
    question: 'Do I need to verify my driver\'s license before booking?',
    answer:
      'Yes. Submit a photo of your driver\'s license, national ID, or passport from your dashboard. Once our team approves it, you can book any vehicle without resubmitting.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We support international cards via Stripe, and local Ethiopian payment methods - Telebirr, CBE Birr, and HelloCash - via Chapa. You choose your preferred method at checkout.',
  },
  {
    question: 'Can I cancel a booking?',
    answer:
      'Yes, free of charge, as long as your booking hasn\'t started yet (status is Pending or Confirmed). Once a rental is active, cancellations aren\'t available through the platform - contact support instead.',
  },
  {
    question: 'Is vehicle delivery available?',
    answer:
      'Yes. At checkout, you can request delivery to your location. The fee is calculated based on the real distance from your nearest HEROY branch.',
  },
  {
    question: 'What happens if there\'s damage to the vehicle?',
    answer:
      'We inspect every vehicle at pickup and again at return. Any new damage found between the two inspections may result in an additional charge, which we\'ll always explain to you directly.',
  },
  {
    question: 'How do loyalty points work?',
    answer:
      'You earn points automatically whenever a rental is completed. Once you reach the redemption threshold, you can convert points into a discount coupon from your dashboard.',
  },
  {
    question: 'Do you offer accounts for businesses?',
    answer:
      'Yes - HEROY for Business lets a company register a corporate account, add employees, and receive a consolidated monthly billing summary across all employee bookings.',
  },
  {
    question: 'Can I rent a vehicle long-term instead of day-by-day?',
    answer:
      'Yes, weekly and monthly subscription plans are available at a discounted rate compared to daily pricing - ask about this option when browsing the fleet.',
  },
  {
    question: 'What if I need help during my rental?',
    answer:
      'If you have an active rental and run into trouble - a breakdown, flat tire, lockout, or accident - use the roadside assistance option in your booking details to reach our team immediately.',
  },
  {
    question: 'Can I talk to the AI assistant instead of filling out forms?',
    answer:
      'Yes. The assistant (bottom-right of every page) can search vehicles, calculate quotes, check your bookings, and even complete a booking for you through conversation or voice.',
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <AnimatedText as="h1" className="mb-10 text-3xl font-bold sm:text-4xl">
        Frequently Asked Questions
      </AnimatedText>

      <div className="space-y-3">
        {FAQS.map((faq) => (
          <GlassPanel key={faq.question} className="overflow-hidden p-0">
            <details className="group">
              <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-sm font-medium">
                {faq.question}
                <ChevronDown
                  size={16}
                  className="shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                />
              </summary>
              <div className="px-5 pb-4 text-sm leading-relaxed text-muted-foreground">
                {faq.answer}
              </div>
            </details>
          </GlassPanel>
        ))}
      </div>
    </div>
  );
}