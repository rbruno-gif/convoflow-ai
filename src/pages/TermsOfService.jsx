import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function TermsOfService() {
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
          <h1 className="text-4xl font-bold">Terms of Service</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <div className="bg-card rounded-xl p-8 space-y-6 text-sm text-muted-foreground">
          <Section title="1. Agreement to Terms">
            By accessing and using ChatPulse ("Service"), you agree to be bound by these Terms of Service. If you do not agree to abide by the above, please do not use this service.
          </Section>

          <Section title="2. Use License">
            Permission is granted to temporarily download one copy of the materials (information or software) on ChatPulse for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on ChatPulse</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </Section>

          <Section title="3. Disclaimer">
            The materials on ChatPulse are provided on an 'as is' basis. ChatPulse makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
          </Section>

          <Section title="4. Limitations">
            In no event shall ChatPulse or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on ChatPulse, even if ChatPulse or an authorized representative has been notified orally or in writing of the possibility of such damage.
          </Section>

          <Section title="5. Accuracy of Materials">
            The materials appearing on ChatPulse could include technical, typographical, or photographic errors. ChatPulse does not warrant that any of the materials on this website are accurate, complete, or current. ChatPulse may make changes to the materials contained on this website at any time without notice.
          </Section>

          <Section title="6. Materials Reference">
            ChatPulse has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by ChatPulse of the site. Use of any such linked website is at the user's own risk.
          </Section>

          <Section title="7. Modifications">
            ChatPulse may revise these terms of service for this website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
          </Section>

          <Section title="8. Governing Law">
            These terms and conditions are governed by and construed in accordance with the laws of the United States, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
          </Section>

          <Section title="9. User Responsibilities">
            You are responsible for maintaining the confidentiality of your account information and password and for restricting access to your computer. You agree to accept responsibility for all activities that occur under your account or password. You agree to notify ChatPulse immediately of any unauthorized use of your account or any other breach of security.
          </Section>

          <Section title="10. User Content">
            You grant ChatPulse a license to use, reproduce, modify, perform, display, and distribute any content you submit to the Service. ChatPulse may use your feedback or suggestions without any compensation to you.
          </Section>

          <Section title="11. Prohibited Conduct">
            You agree that you will not:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws or regulations in your jurisdiction</li>
              <li>Harass, abuse, or threaten other users</li>
              <li>Post or transmit obscene, offensive, or defamatory content</li>
              <li>Disrupt the normal flow of dialogue within the Service</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Impersonate or misrepresent your affiliation with any person or entity</li>
            </ul>
          </Section>

          <Section title="12. Intellectual Property Rights">
            The Service and its entire contents, features, and functionality (including but not limited to all information, software, text, displays, images, video, audio) are owned by ChatPulse, its licensors, or other providers of such material and are protected by United States and international copyright, trademark, and other intellectual property laws.
          </Section>

          <Section title="13. Subscription and Fees">
            If you subscribe to a paid plan, you agree to pay the fees and charges that you incur. ChatPulse reserves the right to change fees at any time with notice. Your continued use of the Service after such notice constitutes your acceptance of the new fees.
          </Section>

          <Section title="14. Termination">
            ChatPulse may terminate or suspend your account and access to the Service at any time, for any reason, including if we reasonably believe you are in violation of these terms or if we are required to do so by law.
          </Section>

          <Section title="15. Indemnification">
            You agree to indemnify, defend, and hold harmless ChatPulse and its affiliates from any claims, damages, losses, and expenses arising from your use of the Service or violation of these terms.
          </Section>

          <Section title="16. Limitation of Liability">
            To the fullest extent allowed by law, ChatPulse shall not be liable for any indirect, incidental, special, consequential, or punitive damages, regardless of the cause of action or theory of liability, even if advised of the possibility of such damages.
          </Section>

          <Section title="17. Severability">
            If any provision of these Terms of Service is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
          </Section>

          <Section title="18. Contact Information">
            If you have any questions about these Terms of Service, please contact us at:
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Email:</strong> legal@chatpulse.com</li>
              <li><strong>Support:</strong> support@chatpulse.com</li>
              <li><strong>Mailing Address:</strong> ChatPulse Inc., Legal Team, [Your Address]</li>
            </ul>
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