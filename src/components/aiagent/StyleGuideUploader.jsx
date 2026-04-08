import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Upload, FileText, Loader2, CheckCircle, AlertCircle, Sparkles, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function StyleGuideUploader({ brandId, currentInstructions, onInstructionsUpdated }) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null); // { preview, merged }
  const [applying, setApplying] = useState(false);
  const inputRef = useRef(null);
  const { toast } = useToast();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(f.type) && !f.name.endsWith('.txt') && !f.name.endsWith('.pdf') && !f.name.endsWith('.doc') && !f.name.endsWith('.docx')) {
      toast({ title: 'Unsupported file type', description: 'Please upload a PDF, Word document, or text file.', variant: 'destructive' });
      return;
    }
    setFile(f);
    setResult(null);
  };

  const process = async () => {
    if (!file) return;
    setProcessing(true);
    setResult(null);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const res = await base44.functions.invoke('processStyleGuide', {
        file_url,
        brand_id: brandId,
        current_instructions: currentInstructions || '',
      });
      setResult(res.data);
    } catch (err) {
      toast({ title: 'Processing failed', description: err.message, variant: 'destructive' });
    }
    setProcessing(false);
  };

  const applyInstructions = async () => {
    if (!result?.merged) return;
    setApplying(true);
    await onInstructionsUpdated(result.merged);
    setApplying(false);
    setResult(null);
    setFile(null);
    toast({ title: 'AI instructions updated from style guide!' });
  };

  return (
    <div className="border border-dashed border-violet-200 rounded-xl p-5 bg-violet-50/30 space-y-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-violet-500" />
        <p className="text-sm font-semibold text-gray-800">Upload Style Guide / Tone-of-Voice Document</p>
      </div>
      <p className="text-xs text-gray-500">Upload a brand style guide or tone document. The AI will extract the tone rules and automatically update the AI instructions below.</p>

      {!file ? (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${dragging ? 'border-violet-400 bg-violet-50' : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'}`}>
          <Upload className="w-7 h-7 mx-auto mb-2 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">Drop your file here or click to browse</p>
          <p className="text-xs text-gray-400 mt-1">PDF, Word (.docx), or plain text (.txt)</p>
          <input ref={inputRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={e => handleFile(e.target.files[0])} />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl p-3 shadow-sm">
            <div className="w-9 h-9 rounded-lg bg-violet-100 flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4 text-violet-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
              <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button onClick={() => { setFile(null); setResult(null); }} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {!result && (
            <button onClick={process} disabled={processing}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #4f46e5)' }}>
              {processing ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing document...</> : <><Sparkles className="w-4 h-4" /> Extract Tone & Update Instructions</>}
            </button>
          )}

          {result && (
            <div className="space-y-3">
              <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-green-500" /> Extracted Tone Rules
                </p>
                <p className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{result.summary}</p>
              </div>
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs font-semibold text-amber-800 mb-1">Preview of Updated Instructions</p>
                <p className="text-xs text-amber-700 leading-relaxed line-clamp-6">{result.merged}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setResult(null); setFile(null); }}
                  className="flex-1 py-2 rounded-xl text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Discard
                </button>
                <button onClick={applyInstructions} disabled={applying}
                  className="flex-1 py-2 rounded-xl text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-70"
                  style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}>
                  {applying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                  Apply to AI Instructions
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}