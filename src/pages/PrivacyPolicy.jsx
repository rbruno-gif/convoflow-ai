import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> Back
            </Button>
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-2 mb-8">
          <h1 className="text-4xl font-bold">Privacy Policy</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-card rounded-xl p-8 space-y-6 text-sm text-muted-foreground">
          <Section title="1. Information We Collect">
            We collect information you provide directly, including:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Account and profile information</li>
              <li>Customer conversation data</li>
              <li>Usage analytics and performance metrics</li>
              <li>Device and browser information</li>
            </ul>
          </Section>

          <Section title="2. How We Use Your Information">
            We use the information we collect to:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Provide and improve our service</li>
              <li>Train and enhance our AI models</li>
              <li>Generate analytics and reports</li>
              <li>Comply with legal obligations</li>
            </ul>
          </Section>

          <Section title="3. Data Security">
            We implement industry-standard security measures to protect your data:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>End-to-end encryption for sensitive data</li>
              <li>Regular security audits and testing</li>
              <li>Secure data storage and backups</li>
              <li>Access controls and authentication</li>
            </ul>
          </Section>

          <Section title="4. Third-Party Services">
            We may integrate with third-party services (Facebook, Gmail, etc.) with your authorization. These services are governed by their own privacy policies.
          </Section>

          <Section title="5. Data Retention">
            We retain conversation data and analytics for as long as your account is active. You can request data deletion at any time.
          </Section>

          <Section title="6. Your Rights">
            You have the right to:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Access your data</li>
              <li>Request data deletion</li>
              <li>Opt-out of analytics</li>
              <li>Export your data</li>
            </ul>
          </Section>

          <Section title="7. Data Sharing and Disclosure">
            We do not sell your personal information. We may share data with:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Service providers and contractors who assist in operating our platform</li>
              <li>Law enforcement when legally required or to protect our rights</li>
              <li>Business partners with your explicit consent</li>
              <li>Payment processors for transaction handling</li>
            </ul>
          </Section>

          <Section title="8. Cookies and Tracking">
            We use cookies and similar technologies to:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Maintain user sessions and authentication</li>
              <li>Remember user preferences</li>
              <li>Collect analytics and usage data</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
            You can disable cookies in your browser settings, though this may limit functionality.
          </Section>

          <Section title="9. International Data Transfers">
            Your data may be transferred, stored, and processed in countries other than your country of residence. These countries may have different data protection laws. By using our service, you consent to such transfers.
          </Section>

          <Section title="10. Children's Privacy">
            ChatPulse is not intended for users under 13 years of age. We do not knowingly collect data from children under 13. If we discover we have collected such data, we will delete it immediately.
          </Section>

          <Section title="11. Changes to Privacy Policy">
            We may update this privacy policy periodically to reflect changes in our practices, technology, or legal requirements. We will notify you of material changes via email or prominent notice on our website. Your continued use of the service constitutes acceptance of the updated policy.
          </Section>

          <Section title="12. Your Privacy Rights">
            Depending on your location, you may have rights including:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Right to Access:</strong> Request a copy of your personal data</li>
              <li><strong>Right to Correction:</strong> Update inaccurate information</li>
              <li><strong>Right to Deletion:</strong> Request removal of your data</li>
              <li><strong>Right to Portability:</strong> Obtain data in a portable format</li>
              <li><strong>Right to Opt-Out:</strong> Decline marketing communications</li>
              <li><strong>Right to Object:</strong> Challenge certain data processing</li>
            </ul>
          </Section>

          <Section title="13. Data Breach Notification">
            In the event of a data breach affecting your personal information, we will notify you promptly and provide details about the breach, the data affected, and steps we are taking to address it. We comply with all applicable data breach notification laws.
          </Section>

          <Section title="14. Third-Party Links and Services">
            Our platform may contain links to third-party websites and services. We are not responsible for their privacy practices. We encourage you to review their privacy policies before providing any information.
          </Section>

          <Section title="15. California Privacy Rights (CCPA)">
            California residents have specific rights under the California Consumer Privacy Act:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Right to know what personal information is collected, used, and shared</li>
              <li>Right to delete personal information collected from you</li>
              <li>Right to opt-out of personal information sales</li>
              <li>Right to non-discrimination for exercising your privacy rights</li>
            </ul>
          </Section>

          <Section title="16. EU/GDPR Compliance">
            For users in the European Union, we comply with the General Data Protection Regulation (GDPR). We process data only with legitimate legal bases, ensure data minimization, and respect user rights including the right to be forgotten and data portability.
          </Section>

          <Section title="17. Data Processing Agreement">
            If you are using ChatPulse as a business or processing data on behalf of others, a Data Processing Agreement (DPA) is available. Please contact us to execute a DPA if required.
          </Section>

          <Section title="18. Contact Us">
            For privacy concerns, data requests, or inquiries:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Email:</strong> privacy@chatpulse.com</li>
              <li><strong>Support:</strong> support@chatpulse.com</li>
              <li><strong>Mailing Address:</strong> ChatPulse Inc., Privacy Team, [Your Address]</li>
            </ul>
            We will respond to your request within 30 days.
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold text-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}