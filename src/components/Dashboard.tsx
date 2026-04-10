'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Search, Activity, TrendingUp, RefreshCw, BarChart2, Bookmark, BookmarkPlus } from 'lucide-react';
import { EMA, RSI, MACD } from 'technicalindicators';

interface TrendData {
  time: string;
  formattedTime: string;
  formattedAxisTime: string;
  value: number[];
  hasData: boolean[];
}

interface ChartData {
  date: string;
  value: number;
  ema: number | null;
  rsi: number | null;
  macd: number | null;
}

export default function Dashboard() {
  const [keyword, setKeyword] = useState('artificial intelligence');
  const [searchInput, setSearchInput] = useState('artificial intelligence');
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  
  // Toggles for indicators
  const [showEMA, setShowEMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  const fetchData = useCallback(async () => {
    if (!keyword.trim()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/trends?keyword=${encodeURIComponent(keyword)}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const rawData: TrendData[] = await res.json();
      
      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        setError('No data found for this keyword');
        setData([]);
        setLoading(false);
        return;
      }

      // Process raw data
      const values = rawData.map(d => d.value[0] || 0);
      
      // Calculate indicators
      // EMA (period 20)
      const emaValues = EMA.calculate({ period: 20, values });
      // RSI (period 14)
      const rsiValues = RSI.calculate({ period: 14, values });
      // MACD (fast 12, slow 26, signal 9)
      const macdValues = MACD.calculate({ 
        fastPeriod: 12, 
        slowPeriod: 26, 
        signalPeriod: 9, 
        SimpleMAOscillator: false, 
        SimpleMASignal: false, 
        values 
      });

      // Pad indicator arrays with nulls at the beginning to match the length of the original data
      const padArray = (arr: any[], length: number) => {
        const diff = length - arr.length;
        return [...Array(diff).fill(null), ...arr];
      };

      const paddedEma = padArray(emaValues, values.length);
      const paddedRsi = padArray(rsiValues, values.length);
      const paddedMacd = padArray(macdValues.map(m => m.MACD), values.length);

      const chartData: ChartData[] = rawData.map((d, i) => ({
        date: d.formattedAxisTime || d.formattedTime,
        value: values[i],
        ema: paddedEma[i],
        rsi: paddedRsi[i],
        macd: paddedMacd[i],
      }));

      setData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [keyword]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetch('/api/bookmarks')
      .then(res => res.json())
      .then(data => setBookmarks(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load bookmarks', err));
  }, []);

  const toggleBookmark = async (kw: string) => {
    try {
      if (bookmarks.includes(kw)) {
        const res = await fetch('/api/bookmarks', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: kw })
        });
        const data = await res.json();
        setBookmarks(Array.isArray(data) ? data : []);
      } else {
        const res = await fetch('/api/bookmarks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: kw })
        });
        const data = await res.json();
        setBookmarks(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  // Custom tooltips
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="custom-tooltip">
          <p className="label">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="item" style={{ color: entry.color }}>
              <span>{entry.name}:</span>
              <span>{Number(entry.value).toFixed(2)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const getLatestValue = (key: keyof ChartData) => {
    if (data.length === 0) return 0;
    // Find last non-null value
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][key] !== null) {
        return Number(data[i][key]).toFixed(2);
      }
    }
    return 0;
  };

  return (
    <div className="container">
      <div className="header">
        <h1 className="title">Trend Intelligence</h1>
        <p className="subtitle">Predictive analytics engine powered by Google Trends data</p>
      </div>

      <form onSubmit={handleSearch} className="search-container">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Enter a keyword (e.g. artificial intelligence, react, crypto)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <RefreshCw className="spinner" style={{ width: 18, height: 18, border: 'none', animation: 'spin 1s linear infinite' }} /> : 'Analyze'}
        </button>
      </form>

      <div className="bookmarks-container">
        <span className="bookmarks-label"><Bookmark size={14} /> Bookmarks:</span>
        {bookmarks.map(b => (
          <div key={b} className={`bookmark-tag ${b === keyword ? 'active' : ''}`}>
            <span onClick={() => { setSearchInput(b); setKeyword(b); }}>{b}</span>
            <button className="bookmark-remove" aria-label={`Remove ${b} bookmark`} onClick={() => toggleBookmark(b)}>×</button>
          </div>
        ))}
        {!bookmarks.includes(keyword) && keyword.trim() !== '' && (
          <button className="bookmark-add" onClick={() => toggleBookmark(keyword)}>
            <BookmarkPlus size={14} /> Bookmark current
          </button>
        )}
      </div>

      {error && <div style={{ color: 'var(--danger-color)', textAlign: 'center', marginBottom: '1rem' }}>{error}</div>}

      <div className="metrics-grid">
        <div className={`metric-card glass-panel ${showEMA ? 'active' : ''}`} onClick={() => setShowEMA(!showEMA)}>
          <div className="metric-header">
            <span>Trend Momentum (EMA)</span>
            <TrendingUp size={16} color="var(--ema-color)" />
          </div>
          <div className="metric-value">{getLatestValue('ema')}</div>
          <div className="metric-indicator positive">Tracking 20-period avg</div>
        </div>

        <div className={`metric-card glass-panel ${showRSI ? 'active' : ''}`} onClick={() => setShowRSI(!showRSI)}>
          <div className="metric-header">
            <span>Relative Strength (RSI)</span>
            <Activity size={16} color="var(--rsi-color)" />
          </div>
          <div className="metric-value">{getLatestValue('rsi')}</div>
          <div className="metric-indicator">14-period momentum</div>
        </div>

        <div className={`metric-card glass-panel ${showMACD ? 'active' : ''}`} onClick={() => setShowMACD(!showMACD)}>
          <div className="metric-header">
            <span>Convergence (MACD)</span>
            <BarChart2 size={16} color="var(--macd-color)" />
          </div>
          <div className="metric-value">{getLatestValue('macd')}</div>
          <div className="metric-indicator">Oscillator</div>
        </div>
      </div>

      <div className="glass-panel chart-container">
        {loading && data.length === 0 ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Gathering intelligence for "{keyword}"...</p>
          </div>
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickMargin={10} minTickGap={30} />
              <YAxis yAxisId="left" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--text-secondary)" tick={{ fill: 'var(--text-secondary)' }} tickLine={false} axisLine={false} domain={[0, 100]} />
              
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ paddingTop: '20px' }} />
              
              <Line yAxisId="left" type="monotone" dataKey="value" name="Interest" stroke="var(--trend-color)" strokeWidth={3} dot={false} activeDot={{ r: 6, strokeWidth: 0, fill: 'var(--trend-color)' }} />
              
              {showEMA && (
                <Line yAxisId="left" type="monotone" dataKey="ema" name="EMA (20)" stroke="var(--ema-color)" strokeWidth={2} dot={false} />
              )}
              
              {showRSI && (
                <Line yAxisId="right" type="monotone" dataKey="rsi" name="RSI (14)" stroke="var(--rsi-color)" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              )}
              
              {showMACD && (
                <Line yAxisId="left" type="monotone" dataKey="macd" name="MACD" stroke="var(--macd-color)" strokeWidth={2} dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="loader-container">
            <p>Enter a keyword to start analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
