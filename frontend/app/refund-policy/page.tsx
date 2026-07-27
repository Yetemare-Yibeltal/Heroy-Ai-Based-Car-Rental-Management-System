export const metadata = {
  title: 'Refund Policy',
};

const SECTIONS = [
  {
    title: '1. Cancellations Before Pickup',
    body: `If you cancel a booking while it is still PENDING or CONFIRMED (i.e. before your rental
    period begins), you are eligible for a full refund of any amount paid. Refunds are processed back
    to your original payment method - Stripe refunds typically appear within 5-10 business days;
    Chapa refunds are processed through Chapa's support channel and may take slightly longer.`,
  },
  {
    title: '2. Cancellations After Pickup',
    body: `Once a rental has started (ACTIVE status), it can no longer be cancelled for a refund
    through the platform. If you experience an issue with your vehicle during an active rental,
    please use the in-app roadside assistance feature or contact support directly.`,
  },
  {
    title: '3. Vehicle Unavailability',
    body: `In the rare event that a vehicle becomes unavailable after your booking is confirmed but
    before pickup (e.g. due to unexpected maintenance), you will receive a full refund automatically,
    along with the option to book a comparable vehicle at no additional cost.`,
  },
  {
    title: '4. Insurance & Delivery Add-Ons',
    body: `If your entire booking is refunded, any insurance or delivery fees paid as part of that
    booking are refunded in full alongside the base rental amount.`,
  },
  {
    title: '5. Coupon & Loyalty Point Adjustments',
    body: `If a booking made with a coupon code is cancelled and refunded, the coupon is not
    automatically reissued. If you believe this was in error, please contact our support team. Any
    loyalty points earned from a cancelled or refunded booking will be reversed.`,
  },
  {
    title: '6. Damage-Related Charges',
    body: `Charges resulting from new damage identified during the return inspection are separate
    from your original rental payment and are not covered under this refund policy. You will be
    notified directly if any such charge applies, with the opportunity to dispute it with our team.`,
  },
  {
    title: '7. How to Request a Refund',
    body: `Most refunds are processed automatically when you cancel an eligible booking from your
    dashboard. For any refund questions not resolved automatically, please reach out through our
    contact page.`,
  },
];

export default function RefundPolicyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Refund Policy</h1>
      <p className="mb-10 text-sm text-muted-foreground">Last updated: January 2026</p>

      <div className="space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 font-display text-lg font-semibold">{section.title}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{section.body}</p>
          </section>
        ))}
      </div>
    </div>
  );
}