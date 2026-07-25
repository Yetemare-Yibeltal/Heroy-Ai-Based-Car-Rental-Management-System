export const metadata = {
  title: 'Terms of Service',
};

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By creating an account or booking a vehicle through HEROY, you agree to these Terms of
    Service. If you do not agree, please do not use the platform.`,
  },
  {
    title: '2. Eligibility & Driver Verification',
    body: `You must be at least 21 years of age and hold a valid driver's license, national ID, or
    passport to book a vehicle. All renters must submit a verification document through their
    dashboard, which must be approved by our team before a booking can be completed. Providing false
    or altered documents will result in immediate account suspension.`,
  },
  {
    title: '3. Bookings & Availability',
    body: `A booking is only confirmed once payment is successfully processed. Vehicle availability
    is checked in real time at the moment of booking; in the rare case of a scheduling conflict, we
    will notify you promptly and offer a full refund or an alternative vehicle.`,
  },
  {
    title: '4. Cancellations',
    body: `Bookings may be cancelled free of charge while in PENDING or CONFIRMED status. Once a
    rental has begun (ACTIVE status), it can no longer be cancelled through the platform - please
    contact our support team for any issues during an active rental.`,
  },
  {
    title: '5. Pricing, Taxes & Payments',
    body: `Prices are shown per day and include applicable taxes calculated based on your rental
    location. Payments are processed securely through Stripe (international cards) or Chapa
    (Telebirr, CBE Birr, HelloCash, and local cards). All charges are final once a booking is
    confirmed, subject to our refund policy.`,
  },
  {
    title: '6. Insurance & Delivery Add-Ons',
    body: `Optional insurance coverage and vehicle delivery are available at checkout for an
    additional fee, calculated based on your rental duration and delivery distance. These add-ons
    are optional and clearly itemized in your price breakdown before you confirm a booking.`,
  },
  {
    title: '7. Vehicle Condition & Inspections',
    body: `A vehicle condition inspection is conducted at pickup and again at return. Any new damage
    identified between these two inspections may result in additional charges, which will be
    communicated to you directly.`,
  },
  {
    title: '8. Loyalty Points & Coupons',
    body: `Loyalty points are earned automatically on completed rentals and may be redeemed for
    discount coupons through your dashboard. Coupons have defined expiration dates and usage limits
    as stated at the time of issuance.`,
  },
  {
    title: '9. Account Termination',
    body: `We reserve the right to suspend or terminate accounts that violate these terms, provide
    fraudulent information, or misuse the platform. You may request deletion of your account data at
    any time through your dashboard's privacy settings.`,
  },
  {
    title: '10. Changes to These Terms',
    body: `We may update these terms from time to time. Continued use of the platform after changes
    are posted constitutes acceptance of the revised terms.`,
  },
];

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Terms of Service</h1>
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