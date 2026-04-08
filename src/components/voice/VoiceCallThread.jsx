import { useState } from 'react';
import { Phone, Download, Copy, CheckCircle, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function VoiceCallThread({ callLog }) {
  const [showTranscript, setShowTranscript] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!callLog) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(callLog.transcript || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const directionLabel = callLog.call_direction === 'inbound' ? 'Inbound' : 'Outbound';
  const statusColor = {
    'completed': 'bg-green-100 text-green-700',
    'in_progress': 'bg-blue-100 text-blue-700',
    'no_answer': 'bg-gray-100 text-gray-700',
    'voicemail': 'bg-orange-100 text-orange-700',
    'transferred': 'bg-purple-100 text-purple-700',
    'failed': 'bg-red-100 text-red-700'
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center bg-teal-100">
            <Phone className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">Voice Call</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {directionLabel} • {formatDistanceToNow(new Date(callLog.created_date), { addSuffix: true })}
            </p>
          </div>
          <span className={`ml-auto px-3 py-1 rounded-full text-xs font-semibold ${statusColor[callLog.call_status] || 'bg-gray-100 text-gray-700'}`}>
            {callLog.call_status}
          </span>
        </div>
      </div>

      {/* Call Details */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Duration</p>
          <p className="text-lg font-bold text-gray-900">{Math.floor(callLog.duration_seconds / 60)}:{String(callLog.duration_seconds % 60).padStart(2, '0')}</p>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Intent</p>
          <p className="text-sm font-semibold text-gray-900 truncate">{callLog.intent_detected || 'N/A'}</p>
          {callLog.intent_confidence && <p className="text-xs text-gray-500 mt-0.5">{Math.round(callLog.intent_confidence * 100)}% confident</p>}
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">AI Resolution</p>
          <div className="flex items-center gap-1.5">
            {callLog.ai_resolution ? (
              <>
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">Resolved</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-orange-700">Escalated</span>
            )}
          </div>
        </div>
      </div>

      {/* Recording */}
      {callLog.recording_url && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-blue-900 mb-3">Call Recording</p>
          <div className="flex items-center gap-3">
            <button className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Play className="w-4 h-4 text-white" />
            </button>
            <audio src={callLog.recording_url} controls className="flex-1" />
            <a href={callLog.recording_url} download className="p-2 hover:bg-blue-100 rounded-lg transition-colors">
              <Download className="w-4 h-4 text-blue-600" />
            </a>
          </div>
        </div>
      )}

      {/* Transcript */}
      {callLog.transcript && (
        <div className="space-y-3">
          <button
            onClick={() => setShowTranscript(!showTranscript)}
            className="text-sm font-semibold text-gray-900 flex items-center gap-2 hover:text-teal-600 transition-colors"
          >
            {showTranscript ? '▼' : '▶'} Full Transcript
          </button>
          {showTranscript && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3 max-h-60 overflow-y-auto">
              <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{callLog.transcript}</div>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1 text-xs rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                {copied ? (
                  <><CheckCircle className="w-3 h-3 text-green-600" /> Copied</>
                ) : (
                  <><Copy className="w-3 h-3 text-gray-400" /> Copy</>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Related Ticket */}
      {callLog.ticket_created && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <p className="text-xs font-semibold text-purple-900 mb-2">Support Ticket Created</p>
          <p className="text-sm text-purple-700">Ticket #{callLog.ticket_created} • {callLog.outcome}</p>
        </div>
      )}
    </div>
  );
}