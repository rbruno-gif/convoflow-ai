import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { GitCommit, ExternalLink, GitBranch, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function CommitLogs() {
  const { data: commits = [], isLoading } = useQuery({
    queryKey: ['commit-logs'],
    queryFn: () => base44.entities.CommitLog.list('-committed_at', 100),
  });

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(124,58,237,0.1)' }}>
          <GitCommit className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Commit Logs</h1>
          <p className="text-xs text-gray-400">{commits.length} commits tracked</p>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
      ) : commits.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <GitCommit className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No commits logged yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {commits.map(commit => (
            <div key={commit.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 mt-0.5">
                  <GitCommit className="w-4 h-4 text-gray-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{commit.message}</p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {commit.author_name && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <User className="w-3 h-3" /> {commit.author_name}
                      </span>
                    )}
                    {commit.repo && (
                      <span className="flex items-center gap-1 text-xs text-gray-400">
                        <GitBranch className="w-3 h-3" /> {commit.repo}
                      </span>
                    )}
                    {commit.branch && (
                      <span className="text-xs text-violet-600 bg-violet-50 px-1.5 py-0.5 rounded font-mono">{commit.branch}</span>
                    )}
                    {commit.committed_at && (
                      <span className="text-xs text-gray-400">
                        {formatDistanceToNow(new Date(commit.committed_at), { addSuffix: true })}
                      </span>
                    )}
                  </div>
                  {commit.sha && (
                    <p className="text-[10px] font-mono text-gray-300 mt-1">{commit.sha.slice(0, 7)}</p>
                  )}
                </div>
                {commit.url && (
                  <a href={commit.url} target="_blank" rel="noopener noreferrer"
                    className="shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}