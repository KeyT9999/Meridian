
import React, { useState, useEffect, useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { ArrowUpRight, ArrowDownRight, Activity, RefreshCw, Loader2, Filter } from 'lucide-react';
import { TrendItem } from '../types';
import { fetchCryptoTrends } from '../services/geminiService';

const CHART_DATA = [
  { time: '00:00', sentiment: 45 },
  { time: '04:00', sentiment: 52 },
  { time: '08:00', sentiment: 48 },
  { time: '12:00', sentiment: 61 },
  { time: '16:00', sentiment: 55 },
  { time: '20:00', sentiment: 67 },
  { time: '24:00', sentiment: 75 },
];

const CACHE_KEY_TRENDS = 'meridian_cache_trends';

const TrendDetection: React.FC = () => {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sentimentFilter, setSentimentFilter] = useState<'ALL' | 'Bullish' | 'Neutral' | 'Bearish'>('ALL');
  const [sortMode, setSortMode] = useState<'RANK' | 'VOLUME' | 'MOVE'>('RANK');

  // Initial Load: Try Cache First, if empty then Fetch
  useEffect(() => {
    const loadFromCache = () => {
      const cachedTrends = localStorage.getItem(CACHE_KEY_TRENDS);
      if (cachedTrends) {
        try {
          setTrends(JSON.parse(cachedTrends));
          setIsLoading(false);
          return;
        } catch (e) { console.error("Cache parse error", e); }
      }
      // If no cache, fetch
      handleRefresh();
    };

    loadFromCache();
  }, []);

  const handleRefresh = async () => {
    setIsLoading(true);
    try {
      const data = await fetchCryptoTrends();
      if (data.length > 0) {
        setTrends(data);
        localStorage.setItem(CACHE_KEY_TRENDS, JSON.stringify(data));
      } else {
        // Fallback if API fails to parse (keep existing or mock)
        if (trends.length === 0) {
           setTrends([
            { rank: 1, keyword: '#Bitcoin', mentions: '45.2K', sentiment: 'Bullish', change: 23 },
            { rank: 2, keyword: '#AI', mentions: '38.9K', sentiment: 'Bullish', change: 45 },
            { rank: 3, keyword: '$SOL', mentions: '32.1K', sentiment: 'Bullish', change: 12 },
            { rank: 4, keyword: 'LayerZero', mentions: '28.4K', sentiment: 'Neutral', change: -8 },
          ]);
        }
      }
    } catch (e) {
      console.error("Fetch trends failed", e);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTrends = useMemo(() => {
    let base = trends;
    if (sentimentFilter !== 'ALL') {
      base = base.filter(t => t.sentiment === sentimentFilter);
    }
    const sorted = [...base].sort((a, b) => {
      if (sortMode === 'RANK') return a.rank - b.rank;
      if (sortMode === 'VOLUME') {
        // Extract numeric mentions if possible, fallback to original order
        const parseMentions = (m: string) => {
          const match = m.replace(/,/g, '').match(/[\d.]+/);
          if (!match) return 0;
          const value = parseFloat(match[0]);
          if (/k/i.test(m)) return value * 1_000;
          if (/m/i.test(m)) return value * 1_000_000;
          return value;
        };
        return parseMentions(b.mentions) - parseMentions(a.mentions);
      }
      // MOVE: biggest 24h change first
      return Math.abs(b.change) - Math.abs(a.change);
    });
    return sorted;
  }, [trends, sentimentFilter, sortMode]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column: Keyword List + Filters */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="text-primary" /> Trend Detection
            </h2>
            <p className="text-slate-400 text-sm mt-1">Real-time monitoring of Web3 trends, hashtags, and community sentiment</p>
          </div>
          <button 
            onClick={handleRefresh} 
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            Refresh Trends
          </button>
        </div>

        <div className="bg-surface border border-slate-800 rounded-xl p-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
            <div>
              <h3 className="font-semibold text-primary flex items-center gap-2">
                <Activity size={16} /> Trending Keywords
              </h3>
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded border border-primary/20 inline-flex items-center gap-1 mt-1">
                <Filter size={12} /> Social listening feed
              </span>
            </div>
            <div className="flex flex-wrap gap-2 justify-end">
              <div className="flex gap-1 bg-slate-900/60 border border-slate-700 rounded-lg px-1 py-1">
                {['ALL', 'Bullish', 'Neutral', 'Bearish'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setSentimentFilter(s as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wide ${
                      sentimentFilter === s
                        ? 'bg-primary/20 text-primary'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 bg-slate-900/60 border border-slate-700 rounded-lg px-1 py-1">
                {[
                  { id: 'RANK', label: 'Rank' },
                  { id: 'VOLUME', label: 'Volume' },
                  { id: 'MOVE', label: '24h Move' },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setSortMode(opt.id as any)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium uppercase tracking-wide ${
                      sortMode === opt.id
                        ? 'bg-slate-50/10 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-4">
               <Loader2 size={32} className="animate-spin text-primary" />
               <p>Analyzing social signals...</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTrends.map((trend) => (
                <div key={trend.keyword} className="flex items-center justify-between p-4 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 transition-all">
                  <div className="flex items-center gap-4">
                    <span className={`text-xl font-bold font-mono w-8 ${trend.rank <= 3 ? 'text-primary' : 'text-slate-500'}`}>
                      #{trend.rank}
                    </span>
                    <div>
                      <div className="font-bold text-white">{trend.keyword}</div>
                      <div className="text-xs text-slate-500">{trend.mentions} mentions</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium border ${
                      trend.sentiment === 'Bullish' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                      trend.sentiment === 'Bearish' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                      'bg-slate-500/10 text-slate-400 border-slate-500/20'
                    }`}>
                      {trend.sentiment}
                    </span>
                    
                    <div className={`flex items-center text-sm font-medium w-16 justify-end ${
                      trend.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {trend.change >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                      {Math.abs(trend.change)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Sentiment Analysis */}
      <div className="space-y-6">
        <div className="bg-surface border border-slate-800 rounded-xl p-6">
          <h3 className="font-semibold text-white mb-4">Community Sentiment</h3>
          
          <div className="space-y-4 mb-6">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-emerald-500">Bullish</span>
                <span className="text-emerald-500">58%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-[58%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-400">Neutral</span>
                <span className="text-slate-400">27%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-slate-500 w-[27%]"></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-red-500">Bearish</span>
                <span className="text-red-500">15%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 w-[15%]"></div>
              </div>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                  itemStyle={{ color: '#06b6d4' }}
                />
                <Area type="monotone" dataKey="sentiment" stroke="#06b6d4" fillOpacity={1} fill="url(#colorSentiment)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 rounded-xl p-6">
          <h3 className="text-primary font-bold mb-2">Quick Tip</h3>
          <p className="text-sm text-slate-300">
            Create content around trending topics within the first 2-3 hours for maximum visibility. #Bitcoin is currently spiking in engagement.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrendDetection;
