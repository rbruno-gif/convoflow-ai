import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Zap, BarChart3, Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-primary">ChatPulse</div>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
          <div className={`${mobileMenuOpen ? 'block' : 'hidden'} md:flex gap-4 absolute md:static top-16 left-0 right-0 flex-col md:flex-row p-4 md:p-0 bg-background md:bg-transparent border-b md:border-0`}>
            <button onClick={() => setShowPrivacy(true)} className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </button>
            <Link to="/dashboard" className="text-sm text-muted-foreground hover:text-foreground">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="text-center space-y-8">
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            AI-Powered Customer Support
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Deliver exceptional customer experiences with intelligent AI agents and seamless agent handoffs
          </p>
          <div className="flex justify-center gap-4 flex-wrap pt-4">
            <Link to="/dashboard">
              <Button size="lg">Get Started</Button>
            </Link>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<MessageCircle className="w-8 h-8" />}
          title="Intelligent Chat"
          description="AI-powered conversations that understand context and resolve issues in real-time"
        />
        <FeatureCard
          icon={<Zap className="w-8 h-8" />}
          title="Instant Escalation"
          description="Seamless handoff to human agents when needed with conversation history intact"
        />
        <FeatureCard
          icon={<BarChart3 className="w-8 h-8" />}
          title="Deep Analytics"
          description="Track conversations, sentiment, intent, and performance metrics in real-time"
        />
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl text-center space-y-6 mb-20">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to transform your support?</h2>
        <p className="text-lg text-muted-foreground">Join businesses using AI to deliver support at scale</p>
        <Link to="/dashboard">
          <Button size="lg">Start Free Trial</Button>
        </Link>
      </section>

      {/* Privacy Policy Modal */}
      {showPrivacy && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-2xl max-h-[80vh] overflow-y-auto p-8 space-y-6">
            <div className="flex justify-between items-center sticky top-0 bg-background pb-4 border-b">
              <h2 className="text-2xl font-bold">Privacy Policy</h2>
              <button
                onClick={() => setShowPrivacy(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6 text-sm text-muted-foreground">
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

              <Section title="7. Contact Us">
                For privacy concerns or requests, please contact us at support@chatpulse.com
              </Section>

              <p className="text-xs mt-8 pt-4 border-t">
                Last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground">
          <p>&copy; 2026 ChatPulse. All rights reserved.</p>
          <button onClick={() => setShowPrivacy(true)} className="text-primary hover:underline mt-2">
            Privacy Policy
          </button>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }) {
  return (
    <div className="p-6 rounded-xl border bg-card/50 hover:bg-card transition-colors space-y-4">
      <div className="text-primary">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
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