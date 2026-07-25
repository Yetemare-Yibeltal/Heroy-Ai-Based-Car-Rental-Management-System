export const metadata = {
  title: 'Privacy Policy',
};

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect the information you provide when creating an account (name, email, phone),
    when submitting driver verification (license, national ID, or passport images), and when making
    a booking (rental dates, add-ons, delivery address if requested). We do not collect or store
    your full payment card details - these are handled directly and securely by Stripe or Chapa.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your information is used to process bookings, verify your eligibility to rent, calculate
    accurate pricing and applicable taxes, send booking-related notifications (email, SMS, and
    optional push notifications), and improve our fleet and service based on aggregated usage
    patterns.`,
  },
  {
    title: '3. AI Assistant Conversations',
    body: `Conversations with our AI assistant are stored so you can return to a chat without losing
    context, and so our support team can review escalated conversations when you're connected with a
    human agent. These conversations are not used to train third-party AI models.`,
  },
  {
    title: '4. Cookies & Analytics',
    body: `We use essential cookies to keep you signed in. Optional analytics cookies, which help us
    understand site usage, are only activated if you accept them via the cookie consent banner - you
    can decline these at any time without affecting core functionality.`,
  },
  {
    title: '5. Third-Party Services',
    body: `We share the minimum necessary data with Stripe and Chapa to process payments, with
    Cloudinary to store uploaded verification and inspection images, and with Twilio to send SMS
    notifications when enabled. Each of these providers maintains its own privacy and security
    standards.`,
  },
  {
    title: '6. Your Rights (GDPR)',
    body: `You may request a complete export of your personal data, or request that your account be
    anonymized, directly from your dashboard's privacy settings at any time. Anonymization removes
    your personally identifying information while retaining anonymized booking records required for
    legal and accounting purposes.`,
  },
  {
    title: '7. Data Retention',
    body: `We retain booking and payment records for as long as required by applicable tax and
    accounting regulations, even after an account is anonymized. Verification documents are deleted
    entirely upon account anonymization.`,
  },
  {
    title: '8. Contact Us',
    body: `For any privacy-related questions or requests, contact us at support@heroy.example or
    through our contact page.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 font-display text-3xl font-bold">Privacy Policy</h1>
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