import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Send, Lightbulb, TrendingUp, HelpCircle, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const sentimentEmojis = {
  frustrated: '😤',
  neutral: '😐',
  satisfied: '😊',
};

export default function AIGuidancePanel({ conversation }) {
  const { activeBrandId } = useBrand();

  const { data: suggestedReply } = useQuery({
    queryKey: ['ai-suggestion', conversation.id],
    queryFn: async () => {
      // In real implementation, call AI to generate suggestion based on conversation history
      return 'Thank you for reaching out! How can we help you today?';
    },
  });

  const { data: similarConversations = [] } = useQuery({
    queryKey: ['similar-conversations', conversation.id],
    queryFn: () => activeBrandId
      ? base44.entities.Conversation.filter({ brand_id: activeBrandId }, '-created_date', 3)
          .then(convs => convs.slice(0, 3))
      : [],
  });

  const { data: relevantKB = [] } = useQuery({
    queryKey: ['relevant-kb', conversation.id],
    queryFn: () => activeBrandId
      ? base44.entities.KnowledgeBase.filter({
          brand_id: activeBrandId,
          status: 'approved',
        }, '-usage_count', 3)
      : [],
  });

  return (
    <div className="w-80 border-l overflow-y-auto flex flex-col">
      <Tabs defaultValue="guidance" className="flex flex-col h-full">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="guidance" className="flex-1">
            AI Guidance
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex-1">
            Profile
          </TabsTrigger>
        </TabsList>

        <TabsContent value="guidance" className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Sentiment Indicator */}
          <div className="bg-card border rounded-lg p-3">
            <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Sentiment
            </p>
            <p className="text-2xl">
              {sentimentEmojis['neutral']} Neutral
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Updates after each customer message
            </p>
          </div>

          {/* Suggested Reply */}
          {suggestedReply && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-blue-900 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Suggested Reply
              </p>
              <p className="text-sm text-blue-900">{suggestedReply}</p>
              <Button
                size="sm"
                className="w-full gap-1"
                onClick={() => {
                  // Insert into composer
                }}
              >
                <Send className="w-3 h-3" />
                Insert
              </Button>
            </div>
          )}

          {/* Relevant KB Articles */}
          {relevantKB.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <HelpCircle className="w-3 h-3" />
                Relevant KB Articles
              </p>
              {relevantKB.map(article => (
                <div key={article.id} className="bg-card border rounded-lg p-2 text-xs space-y-1">
                  <p className="font-medium line-clamp-2">{article.question}</p>
                  <p className="text-muted-foreground line-clamp-2">{article.answer}</p>
                  <Button size="sm" variant="outline" className="w-full text-xs gap-1">
                    <Copy className="w-3 h-3" />
                    Send
                  </Button>
                </div>
              ))}
            </div>
          )}

          {/* Similar Conversations */}
          {similarConversations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">
                Similar Past Conversations
              </p>
              {similarConversations.map(conv => (
                <button
                  key={conv.id}
                  className="w-full text-left bg-card border rounded-lg p-2 hover:bg-muted transition-colors"
                >
                  <p className="text-xs font-medium">{conv.customer_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {conv.status} · {conv.priority}
                  </p>
                </button>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="flex-1 overflow-y-auto p-4">
          <div className="space-y-3">
            <div className="bg-card border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Customer</p>
              <p className="font-medium">{conversation.customer_name}</p>
              <p className="text-xs text-muted-foreground">{conversation.customer_email}</p>
            </div>

            <div className="bg-card border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-2">Conversation</p>
              <div className="space-y-1 text-xs">
                <p>Status: <span className="font-medium capitalize">{conversation.status}</span></p>
                <p>Channel: <span className="font-medium capitalize">{conversation.channel}</span></p>
                <p>Priority: <span className="font-medium capitalize">{conversation.priority}</span></p>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}