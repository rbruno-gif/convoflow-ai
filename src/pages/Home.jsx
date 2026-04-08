import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageCircle, Zap, BarChart3, Shield, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <button onClick={() => navigate('/privacy')} className="text-sm text-muted-foreground hover:text-foreground">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/terms')} className="text-sm text-muted-foreground hover:text-foreground">
              Terms of Service
            </button>
            <button onClick={() => navigate('/data-deletion')} className="text-sm text-muted-foreground hover:text-foreground">
              Data Deletion
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

      {/* Messenger Demo Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">See AI in Action</h2>
        <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
          <div className="space-y-4 max-w-2xl mx-auto">
            {/* Customer message */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none px-4 py-3 max-w-xs">
                <p className="text-sm">Hi, I need help with my order. It hasn't arrived yet.</p>
              </div>
            </div>
            
            {/* AI response */}
            <div className="flex justify-start">
              <div className="bg-gray-100 text-foreground rounded-lg rounded-tl-none px-4 py-3 max-w-xs">
                <p className="text-sm font-semibold text-primary mb-1">Victor</p>
                <p className="text-sm">I'd be happy to help! Can you provide your order number so I can check the delivery status?</p>
              </div>
            </div>
            
            {/* Customer message */}
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-lg rounded-tr-none px-4 py-3 max-w-xs">
                <p className="text-sm">Sure, it's ORD-12345678</p>
              </div>
            </div>
            
            {/* AI response with action */}
            <div className="flex justify-start">
              <div className="bg-gray-100 text-foreground rounded-lg rounded-tl-none px-4 py-3 max-w-xs space-y-2">
                <p className="text-sm font-semibold text-primary">Victor</p>
                <p className="text-sm">Perfect! Your order is on its way and should arrive by tomorrow. You can track it here: <a href="#" className="text-primary underline">View tracking</a></p>
                <p className="text-sm">Is there anything else I can help with?</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl text-center space-y-6 mb-20">
        <h2 className="text-3xl md:text-4xl font-bold">Ready to transform your support?</h2>
        <p className="text-lg text-muted-foreground">Join businesses using AI to deliver support at scale</p>
        <Link to="/dashboard">
          <Button size="lg">Start Free Trial</Button>
        </Link>
      </section>



      {/* Footer */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-muted-foreground space-y-3">
          <p>&copy; 2026 ChatPulse. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <button onClick={() => navigate('/privacy')} className="text-primary hover:underline">
              Privacy Policy
            </button>
            <button onClick={() => navigate('/terms')} className="text-primary hover:underline">
              Terms of Service
            </button>
            <button onClick={() => navigate('/data-deletion')} className="text-primary hover:underline">
              Data Deletion
            </button>
          </div>
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