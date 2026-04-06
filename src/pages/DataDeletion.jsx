import { ArrowLeft, Trash2, FileText, Shield, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function DataDeletion() {
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
          <h1 className="text-4xl font-bold">Data Deletion & Privacy Rights</h1>
          <p className="text-muted-foreground">Learn how to request deletion of your personal data</p>
        </div>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-sm">Request Data Deletion</h3>
              <p className="text-xs text-muted-foreground">Start the process to permanently delete your account and data</p>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Submit Request
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-semibold text-sm">Download Your Data</h3>
              <p className="text-xs text-muted-foreground">Export all your personal data in a portable format (CSV/JSON)</p>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Download
              </Button>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-5 space-y-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Shield className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-semibold text-sm">Update Privacy Settings</h3>
              <p className="text-xs text-muted-foreground">Manage your preferences for data collection and marketing</p>
              <Button variant="outline" size="sm" className="w-full text-xs">
                Manage
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="bg-card rounded-xl p-8 space-y-6 text-sm text-muted-foreground">
          <Section title="Your Right to Data Deletion">
            <p>
              ChatPulse respects your privacy rights and provides you with options to request the deletion of your personal data. Under various privacy laws including GDPR (European Union), CCPA (California), and others, you have the right to request deletion of your personal information.
            </p>
          </Section>

          <Section title="What Data Can Be Deleted">
            <p>You can request deletion of:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Your account profile information (name, email, phone)</li>
              <li>Conversation history and chat transcripts</li>
              <li>Analytics and behavioral data associated with your account</li>
              <li>Saved preferences and settings</li>
              <li>Order history and transaction records</li>
              <li>Files and documents you uploaded</li>
              <li>Any other personal information we have collected</li>
            </ul>
          </Section>

          <Section title="What Data We May Retain">
            <p>Some data may be retained for legal, compliance, or operational reasons:</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Transaction records for accounting and tax purposes (as required by law)</li>
              <li>Data needed for fraud prevention and security</li>
              <li>Anonymized or aggregated data for analytics</li>
              <li>Legal hold data related to disputes or investigations</li>
              <li>Data required to comply with regulatory requirements</li>
            </ul>
          </Section>

          <Section title="How to Request Data Deletion">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3 space-y-3">
              <h4 className="font-semibold text-sm text-blue-900">Step-by-Step Process:</h4>
              <ol className="space-y-2 ml-4">
                <li className="text-xs text-blue-900">
                  <strong>1. Submit a Request:</strong> Click the "Request Data Deletion" button above or email <code className="bg-blue-100 px-1 rounded">privacy@chatpulse.com</code>
                </li>
                <li className="text-xs text-blue-900">
                  <strong>2. Verify Your Identity:</strong> We will send you an email confirmation link to verify you own the account
                </li>
                <li className="text-xs text-blue-900">
                  <strong>3. Processing Period:</strong> We will process your request within 30 days of verification
                </li>
                <li className="text-xs text-blue-900">
                  <strong>4. Confirmation Email:</strong> You will receive confirmation when your data has been deleted
                </li>
              </ol>
            </div>
          </Section>

          <Section title="Request by Email">
            <p>
              You can also request data deletion by sending an email to <strong>privacy@chatpulse.com</strong> with the subject line "Data Deletion Request" and include:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Your full name</li>
              <li>Email address associated with your account</li>
              <li>Account ID (if known)</li>
              <li>A description of the data you want deleted</li>
              <li>A copy of a valid ID for verification (can be redacted)</li>
            </ul>
          </Section>

          <Section title="Request by Mail">
            <p>Send a written request to:</p>
            <div className="bg-background/50 p-4 rounded border mt-2 font-mono text-xs space-y-1">
              <div>ChatPulse Inc.</div>
              <div>Privacy & Legal Team</div>
              <div>Data Deletion Request</div>
              <div>[Your Address]</div>
              <div>[City, State ZIP]</div>
              <div>United States</div>
            </div>
          </Section>

          <Section title="Processing Timeline">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">1</div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Initial Review (1-2 days)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">We acknowledge receipt and begin identity verification</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">2</div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Verification (3-5 days)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">We verify your identity and ownership of the account</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">3</div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Data Deletion (5-25 days)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">We delete all requested personal data from our systems</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-semibold">4</div>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground text-sm">Confirmation (30 days total)</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">You receive confirmation that deletion is complete</p>
                </div>
              </div>
            </div>
          </Section>

          <Section title="Your Rights Under Different Regulations">
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-foreground text-sm mb-2">🇪🇺 GDPR (European Union)</h4>
                <p className="text-xs">
                  If you are in the EU, you have the right to erasure ("right to be forgotten") under GDPR Article 17. We will honor your request within 30 days.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-foreground text-sm mb-2">🇺🇸 CCPA (California)</h4>
                <p className="text-xs">
                  California residents can request deletion of personal information under the California Consumer Privacy Act. We will process requests within 45 days.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-foreground text-sm mb-2">🇨🇦 PIPEDA (Canada)</h4>
                <p className="text-xs">
                  Canadian residents can request personal information deletion under the Personal Information Protection and Electronic Documents Act.
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <h4 className="font-semibold text-foreground text-sm mb-2">🌍 Other Jurisdictions</h4>
                <p className="text-xs">
                  We honor data deletion requests from all jurisdictions in accordance with applicable privacy laws. Contact us to learn about your specific rights.
                </p>
              </div>
            </div>
          </Section>

          <Section title="Account Deletion vs. Data Deletion">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-sm text-yellow-900 mb-2">⚠️ Important Distinction</h4>
              <ul className="space-y-2 text-xs text-yellow-800">
                <li>
                  <strong>Account Deletion:</strong> Removes your ability to log in; some account data may be retained for compliance
                </li>
                <li>
                  <strong>Data Deletion:</strong> Permanently removes your personal data from our systems (subject to legal retention requirements)
                </li>
              </ul>
            </div>
          </Section>

          <Section title="Frequently Asked Questions">
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">How long does data deletion take?</h4>
                <p className="text-xs">Generally 30 days from when we verify your request. Some data may take longer due to backup systems.</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Can I delete my data while still keeping my account?</h4>
                <p className="text-xs">Yes! You can request selective deletion of certain data types. Contact support@chatpulse.com to specify which data to delete.</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Will deletion affect my past orders?</h4>
                <p className="text-xs">Order records will be retained for accounting and tax purposes, but personal details will be anonymized.</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">Is deletion permanent?</h4>
                <p className="text-xs">Yes. Once deleted, your data cannot be recovered. Please ensure you have downloaded any data you wish to keep.</p>
              </div>

              <div>
                <h4 className="font-semibold text-foreground text-sm mb-1">What if I change my mind?</h4>
                <p className="text-xs">Once deletion is complete, we cannot restore your data. You would need to create a new account and re-enter information.</p>
              </div>
            </div>
          </Section>

          <Section title="Legal Basis for Retention">
            <p>
              We may retain certain data when required by law, for legal claims, to enforce our agreements, or to protect the rights, property, and safety of ChatPulse, our users, or the public.
            </p>
          </Section>

          <Section title="Automated Decision-Making">
            <p>
              Your data deletion request may take some time to process due to technical and legal requirements. We cannot guarantee immediate deletion from all backup systems and third-party services.
            </p>
          </Section>

          <Section title="Contact Us for Data Deletion">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-5 space-y-3">
              <h4 className="font-semibold text-foreground">Data Protection Officer</h4>
              <div className="space-y-2 text-xs">
                <p><strong>Email:</strong> <a href="mailto:privacy@chatpulse.com" className="text-primary hover:underline">privacy@chatpulse.com</a></p>
                <p><strong>Support Team:</strong> <a href="mailto:support@chatpulse.com" className="text-primary hover:underline">support@chatpulse.com</a></p>
                <p><strong>Response Time:</strong> 24-48 hours (business days)</p>
                <p className="text-muted-foreground italic">We will acknowledge your request immediately and begin processing within 5 business days.</p>
              </div>
            </div>
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
      <div className="space-y-2">{children}</div>
    </div>
  );
}