
import React, { useState, useEffect, useMemo } from 'react';
import { Search, TrendingUp, Users, CheckCircle, AlertTriangle, XCircle, RefreshCw, Loader2, Sparkles, Target, Zap, Flame, Clock, Star } from 'lucide-react';
import { NewsItem, ViewState, DailyStrategy } from '../types';
import { fetchTrendingNews, generateDailyStrategy } from '../services/geminiService';

interface NewsDashboardProps {
  onNavigate: (view: ViewState, data?: { topic: string }) => void;
}

type RankedNewsItem = NewsItem & {
  freshnessMinutes: number;
  hotScore: number;
  seoScore: number;
  relativeLabel: string;
};

const CACHE_KEY_NEWS = 'meridian_cache_news';
const CACHE_KEY_STRATEGY = 'meridian_cache_strategy';

const NewsDashboard: React.FC<NewsDashboardProps> = ({ onNavigate }) => {
  const [news, setNews] = useState<RankedNewsItem[]>([]);
  const [strategy, setStrategy] = useState<DailyStrategy | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortMode, setSortMode] = useState<'RECENT' | 'HOT' | 'SEO'>('RECENT');

  const parseRelativeTime = (value: string) => {
    if (!value) return 60 * 24; // default 1 day
    const cleaned = value.toLowerCase();
    const numberMatch = cleaned.match(/(\d+)\s*(minute|min|hour|hr|day|d|h|m)/);
    if (numberMatch) {
      const amount = parseInt(numberMatch[1], 10);
      if (cleaned.includes('min')) return amount;
      if (cleaned.includes('hour') || cleaned.includes('hr') || cleaned.includes('h')) return amount * 60;
      if (cleaned.includes('day') || cleaned.includes('d')) return amount * 60 * 24;
    }
    if (cleaned.includes('yesterday')) return 60 * 24;
    return 60 * 12; // fallback half-day
  };

  const formatRelativeLabel = (minutes: number) => {
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.round(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.round(hours / 24);
    return `${days}d ago`;
  };

  const computeSeoScore = (item: NewsItem) => {
    const titleLength = item.title.length;
    const summaryLength = item.summary.length;
    let score = 40;
    if (titleLength >= 45 && titleLength <= 70) score += 20;
    if (summaryLength >= 140 && summaryLength <= 320) score += 25;
    if (/\b(how|why|guide|report|update)\b/i.test(item.title)) score += 5;
    if (/\b(defi|layer 2|regulation|funding|token)\b/i.test(item.summary)) score += 5;
    return Math.min(100, Math.max(30, Math.round(score)));
  };

  const decorateNews = (items: NewsItem[]): RankedNewsItem[] =>
    items.map((item, idx) => {
      const minutes = parseRelativeTime(item.time);
      return {
        ...item,
        freshnessMinutes: minutes,
        hotScore: Number(item.trendingScore) || (items.length - idx),
        seoScore: computeSeoScore(item),
        relativeLabel: formatRelativeLabel(minutes),
      };
    });

  // Initial Load: Try Cache First, if empty then Fetch
  useEffect(() => {
    const loadFromCache = () => {
      const cachedNews = localStorage.getItem(CACHE_KEY_NEWS);
      const cachedStrategy = localStorage.getItem(CACHE_KEY_STRATEGY);
      
      let hasData = false;

      if (cachedNews) {
        try {
          setNews(decorateNews(JSON.parse(cachedNews)));
          hasData = true;
        } catch (e) { console.error("Cache parse error", e); }
      }

      if (cachedStrategy) {
        try {
          setStrategy(JSON.parse(cachedStrategy));
        } catch (e) { console.error("Cache parse error", e); }
      }

      if (hasData) {
        setIsLoading(false);
      } else {
        // Only fetch automatically if cache is empty
        fetchData();
      }
    };

    loadFromCache();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const liveNews = await fetchTrendingNews();
      if (liveNews.length > 0) {
        setNews(decorateNews(liveNews));
        localStorage.setItem(CACHE_KEY_NEWS, JSON.stringify(liveNews));

        // Generate strategy from fresh news
        const strategyData = await generateDailyStrategy(liveNews);
        if (strategyData) {
          setStrategy(strategyData);
          localStorage.setItem(CACHE_KEY_STRATEGY, JSON.stringify(strategyData));
        }
      }
    } catch (error) {
      console.error("Failed to fetch news", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
  };

  const filteredNews = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const base = news.filter(item => {
      const matchesFilter = filter === 'All' || item.category === filter;
      const matchesSearch =
        item.title.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term);
      return matchesFilter && matchesSearch;
    });

    const sorters: Record<typeof sortMode, (a: RankedNewsItem, b: RankedNewsItem) => number> = {
      RECENT: (a, b) => a.freshnessMinutes - b.freshnessMinutes,
      HOT: (a, b) => b.hotScore - a.hotScore || a.freshnessMinutes - b.freshnessMinutes,
      SEO: (a, b) => b.seoScore - a.seoScore || a.freshnessMinutes - b.freshnessMinutes,
    };

    return [...base].sort(sorters[sortMode]);
  }, [news, filter, searchTerm, sortMode]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Verified':
        return 'text-white bg-emerald-400/10 border-emerald-400/40';
      case 'Needs Review':
        return 'text-white bg-amber-400/10 border-amber-400/40';
      case 'Risky':
        return 'text-white bg-red-400/10 border-red-400/40';
      default:
        return 'text-slate-200 bg-slate-700/40 border-slate-600/60';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Verified': return <CheckCircle size={16} className="mr-1" />;
      case 'Needs Review': return <AlertTriangle size={16} className="mr-1" />;
      case 'Risky': return <XCircle size={16} className="mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">News Dashboard</h2>
          <p className="text-slate-400 text-sm mt-1">Stay updated with the latest Web3 trends and blockchain news</p>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-sm text-slate-300 transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          Refresh News
        </button>
      </div>

      {/* AI Strategy Block */}
      {strategy && (
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-primary/30 rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Sparkles size={100} className="text-primary" />
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-primary" />
              <h3 className="text-sm font-bold text-primary tracking-wider uppercase">AI Daily Strategy</h3>
            </div>
            
            <h2 className="text-xl font-bold text-white mb-4">{strategy.headline}</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                   <TrendingUp size={14} /> Market Mood
                </div>
                <div className={`font-bold ${
                  strategy.marketMood === 'Bullish' ? 'text-emerald-400' : 
                  strategy.marketMood === 'Bearish' ? 'text-red-400' : 'text-amber-400'
                }`}>
                  {strategy.marketMood}
                </div>
              </div>
              
              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                   <Target size={14} /> Focus Topics
                </div>
                <div className="flex flex-wrap gap-2">
                  {strategy.focusTopics.map((topic, i) => (
                    <span key={i} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{topic}</span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                <div className="flex items-center gap-2 text-xs text-slate-400 mb-2">
                   <Zap size={14} /> Action Items
                </div>
                <ul className="text-xs text-slate-300 list-disc list-inside space-y-1">
                  {strategy.actionItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search, Category & Sort */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text"
            placeholder="Search news, topics, or projects..."
            className="w-full bg-surface border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-primary transition-colors"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 min-w-[260px]">
          <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0">
            {['All', 'DeFi', 'NFT', 'Memes', 'Market', 'Regulation'].map(cat => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  filter === cat 
                    ? 'bg-slate-700 text-white border border-slate-600' 
                    : 'bg-transparent text-slate-400 border border-slate-800 hover:border-slate-600'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {[
              { id: 'RECENT', label: 'Latest', icon: Clock },
              { id: 'HOT', label: 'Hot', icon: Flame },
              { id: 'SEO', label: 'SEO Ready', icon: Star },
            ].map(option => {
              const Icon = option.icon;
              return (
                <button
                  key={option.id}
                  onClick={() => setSortMode(option.id as typeof sortMode)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide border transition-colors ${
                    sortMode === option.id
                      ? 'bg-primary/10 text-primary border-primary/40'
                      : 'text-slate-400 border-slate-800 hover:border-slate-600'
                  }`}
                >
                  <Icon size={14} />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* News Cards */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
           <Loader2 size={40} className="animate-spin text-primary" />
           <p>Scanning the blockchain for latest updates...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNews.map((news) => (
            <div key={news.id} className="bg-surface border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all duration-300">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-lg font-semibold text-white">{news.title}</h3>
                <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full border ${getStatusColor(news.verificationStatus)}`}>
                  {getStatusIcon(news.verificationStatus)}
                  {news.verificationStatus}
                </div>
              </div>
              
              <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 mb-3">
                <span className="inline-flex items-center gap-1 text-cyan-300 font-semibold">
                  <Clock size={12} /> {news.relativeLabel}
                </span>
                <span>•</span>
                <span className="text-primary">{news.source}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400">{news.category}</span>
              </div>

              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                {news.summary}
              </p>

              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-400">
                  <div className="flex items-center">
                    <TrendingUp size={14} className="mr-1 text-primary" />
                    Trending: <span className="text-white ml-1">{news.trendingScore}/10</span>
                  </div>
                  <div className="flex items-center">
                    <Users size={14} className="mr-1 text-purple-400" />
                    Engagement: <span className="text-white ml-1">{news.engagement}</span>
                  </div>
                  <div className="flex items-center">
                    <Flame size={14} className="mr-1 text-orange-400" />
                    Hot Score: <span className="text-white ml-1">{news.hotScore.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <Star size={14} className="mr-1 text-amber-300" />
                    SEO: <span className="text-white ml-1">{news.seoScore}</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => onNavigate(ViewState.GENERATOR, { topic: news.title })}
                    className="px-4 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/50 rounded-lg text-xs font-medium transition-colors"
                  >
                    Generate Content
                  </button>
                  <button 
                    onClick={() => onNavigate(ViewState.FACT_CHECK, { topic: news.summary, source: news.url })}
                    className="px-4 py-1.5 bg-surface hover:bg-slate-700 text-slate-300 border border-slate-600 rounded-lg text-xs font-medium transition-colors"
                  >
                    Fact Check
                  </button>
                </div>
              </div>
              {news.url && (
                <div className="mt-3 text-xs">
                  <a 
                    href={news.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-primary hover:underline"
                  >
                    View Source →
                  </a>
                </div>
              )}
            </div>
          ))}

          {filteredNews.length === 0 && (
              <div className="text-center py-12 text-slate-500">
                  <p>No news found matching your criteria.</p>
              </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NewsDashboard;
