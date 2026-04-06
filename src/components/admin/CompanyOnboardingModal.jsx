import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

export default function CompanyOnboardingModal({ onClose, onSuccess }) {
  const [step, setStep] = useState(1); // 1: Basic Info, 2: AI Config, 3: Settings
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    logo_url: '',
    website: '',
    industry: '',
    support_email: '',
    support_phone: '',
    business_hours: '',
    owner_email: '',
    plan: 'starter',
    tone_of_voice: 'professional',
    chatbot_name: 'ShopBot',
    ai_instructions: '',
    welcome_message: 'How can I help you today?',
    greeting_message: 'Welcome to our support!',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const generateSlug = () => {
    const slug = formData.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Create Company
      const company = await base44.entities.Company.create({
        name: formData.name,
        slug: formData.slug,
        logo_url: formData.logo_url,
        website: formData.website,
        industry: formData.industry,
        support_email: formData.support_email,
        support_phone: formData.support_phone,
        business_hours: formData.business_hours,
        owner_email: formData.owner_email,
        plan: formData.plan,
        status: 'active',
        features_enabled: [],
      });

      // Create CompanySettings
      await base44.entities.CompanySettings.create({
        company_id: company.id,
        chatbot_name: formData.chatbot_name,
        ai_instructions: formData.ai_instructions,
        tone_of_voice: formData.tone_of_voice,
        welcome_message: formData.welcome_message,
        greeting_message: formData.greeting_message,
      });

      // Add owner as admin agent
      await base44.entities.CompanyAgent.create({
        company_id: company.id,
        email: formData.owner_email,
        full_name: formData.owner_email.split('@')[0],
        role: 'admin',
        status: 'active',
      });

      toast({ title: `Company "${formData.name}" onboarded successfully!` });
      onSuccess();
    } catch (error) {
      toast({
        title: 'Failed to onboard company',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Onboard New Company</CardTitle>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Basic Company Information</p>

              <Input
                placeholder="Company Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />

              <div className="flex gap-2">
                <Input
                  placeholder="URL Slug (auto-generated)"
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  className="flex-1"
                />
                <Button variant="outline" size="sm" onClick={generateSlug}>
                  Generate
                </Button>
              </div>

              <Input
                placeholder="Website URL"
                name="website"
                value={formData.website}
                onChange={handleChange}
              />

              <Input
                placeholder="Logo URL"
                name="logo_url"
                value={formData.logo_url}
                onChange={handleChange}
              />

              <Input
                placeholder="Industry"
                name="industry"
                value={formData.industry}
                onChange={handleChange}
              />

              <Input
                placeholder="Support Email"
                name="support_email"
                type="email"
                value={formData.support_email}
                onChange={handleChange}
              />

              <Input
                placeholder="Support Phone"
                name="support_phone"
                value={formData.support_phone}
                onChange={handleChange}
              />

              <Input
                placeholder="Business Hours (e.g., Mon-Fri 9AM-5PM)"
                name="business_hours"
                value={formData.business_hours}
                onChange={handleChange}
              />

              <Input
                placeholder="Owner Email"
                name="owner_email"
                type="email"
                value={formData.owner_email}
                onChange={handleChange}
              />

              <Select value={formData.plan} onValueChange={(value) => setFormData((prev) => ({ ...prev, plan: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Step 2: AI Config */}
          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">AI Chatbot Configuration</p>

              <Input
                placeholder="Chatbot Name"
                name="chatbot_name"
                value={formData.chatbot_name}
                onChange={handleChange}
              />

              <Select value={formData.tone_of_voice} onValueChange={(value) => setFormData((prev) => ({ ...prev, tone_of_voice: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tone of Voice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="formal">Formal</SelectItem>
                  <SelectItem value="friendly">Friendly</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="casual">Casual</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder="Welcome Message"
                name="welcome_message"
                value={formData.welcome_message}
                onChange={handleChange}
              />

              <Input
                placeholder="Greeting Message"
                name="greeting_message"
                value={formData.greeting_message}
                onChange={handleChange}
              />

              <Textarea
                placeholder="AI Instructions (how the bot should behave)"
                name="ai_instructions"
                value={formData.ai_instructions}
                onChange={handleChange}
                rows={4}
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between pt-4">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 2 && (
              <Button onClick={() => setStep(step + 1)} className="ml-auto">
                Next
              </Button>
            )}
            {step === 2 && (
              <>
                <div />
                <Button onClick={handleSubmit} disabled={loading} className="ml-auto">
                  {loading ? 'Creating...' : 'Create Company'}
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}