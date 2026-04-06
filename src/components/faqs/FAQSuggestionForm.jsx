import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Lightbulb } from 'lucide-react';

export default function FAQSuggestionForm() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [category, setCategory] = useState('general');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) return;

    setLoading(true);
    const user = await base44.auth.me();
    
    await base44.entities.FAQSuggestion.create({
      question: question.trim(),
      answer: answer.trim(),
      category,
      status: 'pending',
      source: 'manual',
      suggested_by: user?.email,
      frequency: 1,
    });

    toast({
      title: 'Suggestion submitted',
      description: 'Admins will review your FAQ suggestion',
      open: true,
    });

    setQuestion('');
    setAnswer('');
    setCategory('general');
    setOpen(false);
    setLoading(false);
  };

  if (!open) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2"
      >
        <Lightbulb className="w-4 h-4" /> Suggest FAQ
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg bg-accent/30">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-sm">Suggest a New FAQ</h3>
      </div>

      <Input
        placeholder="Question..."
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={loading}
        required
      />

      <Textarea
        placeholder="Answer..."
        value={answer}
        onChange={(e) => setAnswer(e.target.value)}
        disabled={loading}
        rows={3}
        required
      />

      <Select value={category} onValueChange={setCategory} disabled={loading}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="shipping">Shipping</SelectItem>
          <SelectItem value="returns">Returns</SelectItem>
          <SelectItem value="payment">Payment</SelectItem>
          <SelectItem value="products">Products</SelectItem>
          <SelectItem value="orders">Orders</SelectItem>
          <SelectItem value="general">General</SelectItem>
        </SelectContent>
      </Select>

      <div className="flex gap-2 justify-end">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button size="sm" disabled={loading || !question.trim() || !answer.trim()}>
          Submit for Approval
        </Button>
      </div>
    </form>
  );
}