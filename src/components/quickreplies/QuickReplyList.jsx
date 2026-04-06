import { Edit2, Trash2, Copy, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function QuickReplyList({
  templates,
  categories,
  onEdit,
  onDelete,
  onDuplicate,
  isLoading,
}) {
  if (isLoading) {
    return <div className="text-center py-12 text-muted-foreground">Loading templates...</div>;
  }

  if (templates.length === 0) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="py-12 text-center text-muted-foreground">
          <Eye className="w-12 h-12 mx-auto opacity-20 mb-3" />
          <p>No templates found. Create one to get started!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {templates.map((template) => (
        <Card key={template.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-foreground truncate">{template.name}</h3>
                    {!template.is_active && <Badge variant="outline" className="text-destructive">Inactive</Badge>}
                  </div>
                  <Badge className={cn('text-xs', categories[template.category]?.color)}>
                    {categories[template.category]?.label}
                  </Badge>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p className="font-medium">{template.usage_count || 0} uses</p>
                </div>
              </div>

              {/* Content Preview */}
              <div className="bg-background/50 rounded p-3 text-sm">
                <p className="text-foreground whitespace-pre-wrap line-clamp-3">{template.content}</p>
              </div>

              {/* Notes */}
              {template.notes && (
                <div className="text-xs text-muted-foreground bg-blue-50 rounded p-2 border border-blue-100">
                  <strong>Note:</strong> {template.notes}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2 border-t">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDuplicate(template)}
                  className="gap-2 text-xs h-8"
                >
                  <Copy className="w-3 h-3" /> Duplicate
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onEdit(template)}
                  className="gap-2 text-xs h-8"
                >
                  <Edit2 className="w-3 h-3" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/5"
                  onClick={() => {
                    if (confirm('Delete this template?')) {
                      onDelete(template.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3" /> Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}