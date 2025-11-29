
import React, { useState, useEffect } from 'react';
import { BookOpen, Trash2, Calendar, FileText, ShieldCheck, Tag } from 'lucide-react';
import { SavedItem, VerificationResult } from '../types';

const Library: React.FC = () => {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'CONTENT' | 'REPORT'>('ALL');

  useEffect(() => {
    const loadItems = () => {
      const saved = localStorage.getItem('meridian_library');
      if (saved) {
        setItems(JSON.parse(saved).reverse()); // Newest first
      }
    };
    loadItems();
  }, []);

  const deleteItem = (id: string) => {
    const newItems = items.filter(item => item.id !== id);
    setItems(newItems);
    localStorage.setItem('meridian_library', JSON.stringify(newItems));
  };

  const filteredItems = items.filter(item => filter === 'ALL' || item.type === filter);

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-primary" /> Content Library
          </h2>
          <p className="text-slate-400 text-sm mt-1">Archives of your generated content and compliance reports</p>
        </div>
        
        <div className="flex gap-2 bg-surface p-1 rounded-lg border border-slate-700">
          {['ALL', 'CONTENT', 'REPORT'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as any)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                filter === f ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {f === 'ALL' ? 'All Items' : f === 'CONTENT' ? 'Drafts' : 'Reports'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-y-auto pb-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-600 border border-dashed border-slate-800 rounded-xl">
            <BookOpen size={48} className="mb-4 opacity-20" />
            <p>Your library is empty. Save generated content to see it here.</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div key={item.id} className="bg-surface border border-slate-800 rounded-xl p-5 hover:border-primary/30 transition-all group flex flex-col h-64">
              <div className="flex justify-between items-start mb-3">
                <div className={`text-xs px-2 py-1 rounded border ${
                  item.type === 'CONTENT' 
                    ? 'text-primary bg-primary/10 border-primary/20' 
                    : 'text-secondary bg-secondary/10 border-secondary/20'
                }`}>
                  {item.type === 'CONTENT' ? 'Generated Draft' : 'Fact Check Report'}
                </div>
                <button 
                  onClick={() => deleteItem(item.id)}
                  className="text-slate-600 hover:text-danger transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <h3 className="font-semibold text-white mb-2 line-clamp-2 min-h-[1.5rem]">{item.title}</h3>
              
              <div className="flex-grow bg-slate-900/50 rounded p-3 mb-3 overflow-hidden">
                {item.type === 'CONTENT' ? (
                  <p className="text-slate-400 text-xs whitespace-pre-wrap line-clamp-6">
                    {item.content as string}
                  </p>
                ) : (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-300">
                      <span>Score:</span>
                      <span className="font-bold">{(item.content as VerificationResult).score}/100</span>
                    </div>
                    <p className="text-slate-400 text-xs line-clamp-4">
                      {(item.content as VerificationResult).analysis}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-auto pt-3 border-t border-slate-800">
                <div className="flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(item.createdAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-1">
                  <Tag size={12} />
                  {item.type === 'CONTENT' ? 'Marketing' : 'Compliance'}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Library;
