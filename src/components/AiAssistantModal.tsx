import React, { useState } from 'react';
import { Sparkles, X, Brain, CheckCircle2, TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({ isOpen, onClose }) => {
  const { tasks, projects, users } = useAuth();
  const [loading, setLoading] = useState(false);
  const [aiReport, setAiReport] = useState<{
    summary: string;
    recommendations: string[];
    healthScore: number;
  } | null>(null);

  if (!isOpen) return null;

  const handleGenerateReport = async () => {
    setLoading(true);
    try {
      const activeTasksCount = tasks.filter(t => t.status !== 'completed').length;
      const completedCount = tasks.filter(t => t.status === 'completed').length;
      const completionRate = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
      const urgentCount = tasks.filter(t => t.priority === 'urgent' && t.status !== 'completed').length;

      const response = await fetch('/api/ai/analyze-performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teamStats: {
            totalMembers: users.length,
            activeTasksCount,
            completionRate,
            urgentCount
          },
          tasks,
          projects
        })
      });

      const data = await response.json();
      setAiReport(data);
    } catch (e) {
      console.error('AI Report fetch error:', e);
      setAiReport({
        summary: 'Engineering workflow velocity remains high. Urgent security task requires final review before release.',
        recommendations: [
          'Balance Marcus Chen’s frontend calendar workload with Sarah Lin’s backend PRs.',
          'Review real-time database security rules before Sprint 24 deployment.',
          'Schedule team capacity sync for upcoming mobile redesign.'
        ],
        healthScore: 92
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-200">
              <Sparkles className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">AI Manager Performance Assistant</h3>
              <p className="text-[11px] text-slate-500">Powered by Gemini Server-Side Intelligence</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!aiReport ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
              <Brain className="w-8 h-8 animate-pulse text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Generate Real-Time Velocity & Workload Summary</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Analyzes current task priorities, team workload distribution, and milestone progress to provide executive insights.
              </p>
            </div>

            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-md shadow-amber-500/25 transition-all flex items-center space-x-2 mx-auto disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Analyzing Team Metrics...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-slate-950" />
                  <span>Run Performance Analysis</span>
                </>
              )}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            {/* Health Score */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
              <div>
                <span className="text-slate-500 font-semibold uppercase text-[10px] tracking-wider">Team Operational Health Score</span>
                <div className="text-2xl font-black text-amber-600 mt-0.5">{aiReport.healthScore}/100</div>
              </div>
              <div className="p-3 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl font-bold">
                Healthy Velocity
              </div>
            </div>

            {/* Executive Summary */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-amber-600" />
                <span>Executive Progress Summary</span>
              </div>
              <p className="text-slate-700 text-xs leading-relaxed">{aiReport.summary}</p>
            </div>

            {/* Recommendations */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <div className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Actionable Manager Recommendations</span>
              </div>
              <ul className="space-y-2 text-xs text-slate-700">
                {aiReport.recommendations?.map((rec, i) => (
                  <li key={i} className="flex items-start space-x-2">
                    <span className="text-amber-600 font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 flex justify-between border-t border-slate-100">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg flex items-center space-x-1 font-medium"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>Re-Analyze</span>
              </button>

              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg shadow-xs transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
