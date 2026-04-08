import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useBrand } from '@/context/BrandContext';
import { Plus, Trash2, RotateCcw, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function KnowledgeScraper() {
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [scraping, setScraping] = useState(null);
  const { activeBrandId } = useBrand();
  const qc = useQueryClient();

  const { data: sources = [] } = useQuery({
    queryKey: ['scraper-sources', activeBrandId],
    queryFn: () => activeBrandId
      ? base44.entities.ScraperSource.filter({ brand_id: activeBrandId })
      : [],
    refetchInterval: 3000,
  });

  const handleAddSource = async () => {
    if (!url.trim() || !name.trim()) return;

    await base44.entities.ScraperSource.create({
      brand_id: activeBrandId,
      url,
      name,
      scrape_status: 'idle',
    });

    setUrl('');
    setName('');
    qc.invalidateQueries({ queryKey: ['scraper-sources', activeBrandId] });
  };

  const handleScrape = async (sourceId) => {
    setScraping(sourceId);

    // Update status to scraping
    await base44.entities.ScraperSource.update(sourceId, { scrape_status: 'scraping' });

    // Simulate scraping (in real implementation, this would call a backend function)
    setTimeout(async () => {
      await base44.entities.ScraperSource.update(sourceId, {
        scrape_status: 'completed',
        last_scraped_at: new Date().toISOString(),
        entry_count: Math.floor(Math.random() * 10) + 3,
      });

      setScraping(null);
      qc.invalidateQueries({ queryKey: ['scraper-sources', activeBrandId] });
    }, 2000);
  };

  const handleDelete = async (sourceId) => {
    if (confirm('Remove this scraper source?')) {
      await base44.entities.ScraperSource.delete(sourceId);
      qc.invalidateQueries({ queryKey: ['scraper-sources', activeBrandId] });
    }
  };

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Website Knowledge Scraper</h1>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Add URL
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add URL to Scrape</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">URL</label>
                <Input
                  placeholder="https://example.com/faq"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Label</label>
                <Input
                  placeholder="e.g., FAQ Page, Help Center"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline">Cancel</Button>
                <Button onClick={handleAddSource}>Add & Scrape</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sources List */}
      {sources.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border text-muted-foreground">
          <p>No sources added yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sources.map(source => (
            <div key={source.id} className="bg-card border rounded-lg p-4 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">{source.name}</h3>
                <p className="text-sm text-muted-foreground truncate">{source.url}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  {source.scrape_status === 'scraping' && (
                    <span className="flex items-center gap-1">
                      <Loader className="w-3 h-3 animate-spin" />
                      Scraping...
                    </span>
                  )}
                  {source.scrape_status === 'completed' && (
                    <span className="flex items-center gap-1 text-green-600">
                      <CheckCircle className="w-3 h-3" />
                      {source.entry_count} entries
                    </span>
                  )}
                  {source.scrape_status === 'failed' && (
                    <span className="flex items-center gap-1 text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      {source.last_error}
                    </span>
                  )}
                  {source.last_scraped_at && (
                    <span>
                      Last: {new Date(source.last_scraped_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleScrape(source.id)}
                  disabled={scraping === source.id}
                  className="gap-1"
                >
                  <RotateCcw className="w-4 h-4" />
                  Rescrape
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(source.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}