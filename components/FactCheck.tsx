
import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, AlertTriangle, CheckCircle, XCircle, FileText, Loader2, Link as LinkIcon, Save } from 'lucide-react';
import { performFactCheck } from '../services/geminiService';
import { VerificationResult, SavedItem } from '../types';

interface FactCheckProps {
  initialText?: string;
  initialSource?: string;
}

const CACHE_KEY_FACT_INPUT = 'meridian_fact_input';
const CACHE_KEY_FACT_RESULT = 'meridian_fact_result';
const CACHE_KEY_FACT_SOURCE = 'meridian_fact_source';

const FactCheck: React.FC<FactCheckProps> = ({ initialText = '', initialSource = '' }) => {
  const [inputText, setInputText] = useState(initialText);
  const [sourceLink, setSourceLink] = useState(initialSource);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<VerificationResult | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const hasAutoChecked = useRef(false);

  // Load from cache on mount
  useEffect(() => {
    const cachedInput = localStorage.getItem(CACHE_KEY_FACT_INPUT);
    const cachedResult = localStorage.getItem(CACHE_KEY_FACT_RESULT);
    const cachedSource = localStorage.getItem(CACHE_KEY_FACT_SOURCE);

    if (cachedInput && !initialText) {
        setInputText(cachedInput);
    }
    
    if (cachedResult && !initialText) {
        try {
            setResult(JSON.parse(cachedResult));
        } catch(e) { console.error(e); }
    }

    if (cachedSource && !initialSource) {
        setSourceLink(cachedSource);
    }

    if (initialText) {
        setInputText(initialText);
    }

    if (initialSource) {
        setSourceLink(initialSource);
    }
  }, []);

  // Sync state to cache
  useEffect(() => {
      localStorage.setItem(CACHE_KEY_FACT_INPUT, inputText);
  }, [inputText]);

  useEffect(() => {
      if (result) {
        localStorage.setItem(CACHE_KEY_FACT_RESULT, JSON.stringify(result));
      }
  }, [result]);

  useEffect(() => {
      if (sourceLink) {
        localStorage.setItem(CACHE_KEY_FACT_SOURCE, sourceLink);
      } else {
        localStorage.removeItem(CACHE_KEY_FACT_SOURCE);
      }
  }, [sourceLink]);

  // Handle prop change
  useEffect(() => {
    if (initialText) setInputText(initialText);
  }, [initialText]);

  useEffect(() => {
    if (initialSource) setSourceLink(initialSource);
  }, [initialSource]);

  // Auto-check effect
  useEffect(() => {
    const autoCheck = async () => {
      // Only auto-check if provided initialText
      if (initialText && !hasAutoChecked.current && !isChecking) {
        hasAutoChecked.current = true;
        await handleVerify(initialText);
      }
    };
    autoCheck();
  }, [initialText]);

  const handleVerify = async (textOverride?: string) => {
    const textToUse = textOverride || inputText;
    if (!textToUse.trim()) return;
    
    setIsChecking(true);
    setResult(null);
    setIsSaved(false);
    const data = await performFactCheck(textToUse, sourceLink);
    setResult(data);
    setIsChecking(false);
  };

  const saveReport = () => {
    if (!result) return;
    
    const newItem: SavedItem = {
      id: crypto.randomUUID(),
      type: 'REPORT',
      title: inputText.substring(0, 50) + (inputText.length > 50 ? '...' : ''),
      content: result,
      createdAt: new Date().toISOString(),
      tags: [result.status]
    };

    const existing = localStorage.getItem('meridian_library');
    const library = existing ? JSON.parse(existing) : [];
    localStorage.setItem('meridian_library', JSON.stringify([...library, newItem]));
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified': return 'text-white bg-emerald-400/10 border-emerald-400/20';
      case 'Needs Review': return 'text-white bg-amber-400/10 border-amber-400/20';
      case 'Risky': return 'text-white bg-red-400/10 border-red-400/20';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-140px)]">
      {/* Input Section */}
      <div className="space-y-6 flex flex-col">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="text-primary" /> Fact Check & Compliance
          </h2>
          <p className="text-slate-400 text-sm mt-1">Verify content accuracy and ensure regulatory compliance before publishing</p>
        </div>

        <div className="bg-surface border border-slate-800 rounded-xl p-6 flex-grow flex flex-col">
          <h3 className="text-sm font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText size={16} /> Submit for Verification
          </h3>
          
          <div className="space-y-2 flex-grow">
            <label className="text-xs text-slate-400">Content to Verify</label>
            <textarea 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Paste article text, tweet draft, or claims here..."
              className="w-full h-full min-h-[200px] bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-white focus:border-primary focus:outline-none resize-none"
            />
          </div>

          <div className="space-y-2 mt-4">
            <label className="text-xs text-slate-400">Source Links (Optional)</label>
            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-lg px-3">
              <LinkIcon size={14} className="text-slate-500 mr-2" />
              <input 
                type="text"
                value={sourceLink}
                onChange={(e) => setSourceLink(e.target.value)}
                placeholder="https://example.com/source"
                className="w-full bg-transparent py-2 text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <button 
            onClick={() => handleVerify()}
            disabled={isChecking || !inputText}
            className="w-full mt-6 bg-primary hover:bg-cyan-400 text-slate-900 font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChecking ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
            Run Fact Check
          </button>
        </div>
      </div>

      {/* Result Section */}
      <div className="bg-surface border border-slate-800 rounded-xl p-6 flex flex-col h-full relative overflow-hidden">
        {isChecking ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-primary/70 animate-pulse">
                <ShieldCheck size={64} className="mb-4" />
                <p className="text-sm">Analyzing patterns and compliance risks...</p>
            </div>
        ) : result ? (
          <div className="space-y-6 animate-fade-in overflow-y-auto relative h-full">
            <div className="flex justify-end absolute top-0 right-0 z-10">
                <button 
                    onClick={saveReport}
                    disabled={isSaved}
                    className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${isSaved ? 'text-emerald-400 bg-emerald-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
                    title="Save Report"
                >
                    <Save size={18} /> {isSaved && <span className="text-xs font-medium">Saved</span>}
                </button>
            </div>
            
            <div className="text-center pb-6 border-b border-slate-800 mt-8">
              <div className={`inline-flex items-center px-4 py-2 rounded-full border mb-4 font-bold text-lg ${getStatusColor(result.status)}`}>
                {result.status === 'Verified' && <CheckCircle className="mr-2" />}
                {result.status === 'Needs Review' && <AlertTriangle className="mr-2" />}
                {result.status === 'Risky' && <XCircle className="mr-2" />}
                {result.status}
              </div>
              <div className="text-4xl font-bold text-white mb-1">{result.score}/100</div>
              <div className="text-xs text-slate-500 uppercase tracking-wide">Safety Score</div>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-2">AI Analysis</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/50 p-4 rounded-lg border border-slate-800">
                {result.analysis}
              </p>
            </div>

            {result.corrections.length > 0 && (
              <div>
                <h4 className="font-semibold text-white mb-2">Suggested Corrections</h4>
                <ul className="space-y-2">
                  {result.corrections.map((correction, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                      <AlertTriangle className="text-accent shrink-0 mt-0.5" size={16} />
                      {correction}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-600">
            <ShieldCheck size={64} className="mb-4 opacity-20" />
            <p className="text-sm">Submit content to see compliance report</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FactCheck;
