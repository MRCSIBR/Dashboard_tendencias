'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Search,
  Activity,
  TrendingUp,
  RefreshCw,
  BarChart2,
  Bookmark,
  BookmarkPlus,
  AlertCircle,
  LineChart as LineChartIcon,
  Globe,
} from 'lucide-react';
import { EMA, RSI, MACD } from 'technicalindicators';

// ─── i18n ────────────────────────────────────────────────────────────────────
type Lang = 'en' | 'es';

const translations: Record<Lang, Record<string, string>> = {
  en: {
    eyebrow:           'Powered by Google Trends',
    title:             'Trend Intelligence',
    subtitle:          'Predictive analytics engine powered by real-time Google Trends data',
    searchPlaceholder: 'Enter a keyword (e.g. artificial intelligence, bitcoin, climate)',
    analyze:           'Analyze',
    bookmarksLabel:    'Bookmarks',
    bookmarkCurrent:   'Bookmark current',
    ema_label:         'Trend Momentum',
    ema_sub:           'Tracking 20-period avg',
    rsi_label:         'Relative Strength',
    rsi_sub:           '14-period momentum',
    macd_label:        'Convergence',
    macd_sub:          'Oscillator',
    toggleHint:        'Click to toggle',
    chartTitle:        'Interest over time',
    loading:           'Gathering intelligence for',
    loadingSub:        'Fetching data from Google Trends…',
    emptyPrompt:       'Enter a keyword above to start your analysis.',
    emptyHint:         'Try: bitcoin, climate change, artificial intelligence',
    interestLine:      'Interest',
    live:              'Live',
    footerText:        'Data sourced from Google Trends · Built with Next.js',
  },
  es: {
    eyebrow:           'Con tecnología de Google Trends',
    title:             'Inteligencia de Tendencias',
    subtitle:          'Motor de análisis predictivo con datos en tiempo real de Google Trends',
    searchPlaceholder: 'Ingresá un término (ej. inteligencia artificial, bitcoin, clima)',
    analyze:           'Analizar',
    bookmarksLabel:    'Favoritos',
    bookmarkCurrent:   'Guardar búsqueda',
    ema_label:         'Impulso de Tendencia',
    ema_sub:           'Promedio móvil 20 períodos',
    rsi_label:         'Fuerza Relativa',
    rsi_sub:           'Momentum 14 períodos',
    macd_label:        'Convergencia',
    macd_sub:          'Oscilador',
    toggleHint:        'Clic para activar',
    chartTitle:        'Interés a lo largo del tiempo',
    loading:           'Analizando tendencias para',
    loadingSub:        'Obteniendo datos de Google Trends…',
    emptyPrompt:       'Ingresá un término arriba para comenzar tu análisis.',
    emptyHint:         'Probá: bitcoin, cambio climático, inteligencia artificial',
    interestLine:      'Interés',
    live:              'En vivo',
    footerText:        'Datos obtenidos de Google Trends · Construido con Next.js',
  },
};

// ─── Types ────────────────────────────────────────────────────────────────────
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

// ─── Component ────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];

  const [keyword, setKeyword] = useState('artificial intelligence');
  const [searchInput, setSearchInput] = useState('artificial intelligence');
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookmarks, setBookmarks] = useState<string[]>([]);

  const [showEMA, setShowEMA] = useState(true);
  const [showRSI, setShowRSI] = useState(false);
  const [showMACD, setShowMACD] = useState(false);

  // ─── Data fetching ──────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/trends?keyword=${encodeURIComponent(keyword)}`);
      if (!res.ok) throw new Error('Failed to fetch data');

      const rawData: TrendData[] = await res.json();

      if (!rawData || !Array.isArray(rawData) || rawData.length === 0) {
        setError(lang === 'en' ? 'No data found for this keyword.' : 'No se encontraron datos para este término.');
        setData([]);
        setLoading(false);
        return;
      }

      const values = rawData.map((d) => d.value[0] || 0);

      const emaValues  = EMA.calculate({ period: 20, values });
      const rsiValues  = RSI.calculate({ period: 14, values });
      const macdValues = MACD.calculate({
        fastPeriod: 12, slowPeriod: 26, signalPeriod: 9,
        SimpleMAOscillator: false, SimpleMASignal: false, values,
      });

      const padArray = (arr: (number | null)[], length: number) => {
        const diff = length - arr.length;
        return [...Array(diff).fill(null), ...arr];
      };

      const paddedEma  = padArray(emaValues, values.length);
      const paddedRsi  = padArray(rsiValues, values.length);
      const paddedMacd = padArray(macdValues.map((m) => m.MACD ?? null), values.length);

      const chartData: ChartData[] = rawData.map((d, i) => ({
        date:  d.formattedAxisTime || d.formattedTime,
        value: values[i],
        ema:   paddedEma[i],
        rsi:   paddedRsi[i],
        macd:  paddedMacd[i],
      }));

      setData(chartData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [keyword, lang]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    fetch('/api/bookmarks')
      .then((r) => r.json())
      .then((d) => setBookmarks(Array.isArray(d) ? d : []))
      .catch(console.error);
  }, []);

  // ─── Bookmark helpers ───────────────────────────────────────────────────
  const toggleBookmark = async (kw: string) => {
    try {
      const method = bookmarks.includes(kw) ? 'DELETE' : 'POST';
      const res = await fetch('/api/bookmarks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: kw }),
      });
      const d = await res.json();
      setBookmarks(Array.isArray(d) ? d : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setKeyword(searchInput);
  };

  // ─── Helpers ────────────────────────────────────────────────────────────
  const getLatestValue = (key: keyof ChartData): string => {
    if (data.length === 0) return '—';
    for (let i = data.length - 1; i >= 0; i--) {
      if (data[i][key] !== null) return Number(data[i][key]).toFixed(2);
    }
    return '—';
  };

  // ─── Custom Tooltip ─────────────────────────────────────────────────────
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        {payload.map((entry: any, i: number) => (
          <div key={i} className="item" style={{ color: entry.color }}>
            <span>{entry.name}:</span>
            <span>{Number(entry.value).toFixed(2)}</span>
          </div>
        ))}
      </div>
    );
  };

  // ─── RSI signal ─────────────────────────────────────────────────────────
  const rsiVal = parseFloat(getLatestValue('rsi'));
  const rsiSignal =
    isNaN(rsiVal) ? '' :
    rsiVal > 70   ? (lang === 'en' ? 'Overbought' : 'Sobrecomprado') :
    rsiVal < 30   ? (lang === 'en' ? 'Oversold'   : 'Sobrevendido') :
                    (lang === 'en' ? 'Neutral'     : 'Neutral');

  const rsiClass = rsiVal > 70 ? 'negative' : rsiVal < 30 ? 'positive' : '';

  // ─── Render ─────────────────────────────────────────────────────────────
  return (
    <>
      {/* ── Navbar ── */}
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="navbar-logo">
            <LineChartIcon size={20} color="#fff" />
          </div>
          <span className="navbar-title">TrendDash</span>
        </div>

        <div className="navbar-right">
          <div className="live-badge">
            <span className="live-dot" />
            {t.live}
          </div>

          {/* Language toggle */}
          <div className="lang-toggle" role="group" aria-label="Language selector">
            <button
              id="lang-en"
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              aria-pressed={lang === 'en'}
            >
              EN
            </button>
            <button
              id="lang-es"
              className={`lang-btn ${lang === 'es' ? 'active' : ''}`}
              onClick={() => setLang('es')}
              aria-pressed={lang === 'es'}
            >
              ES
            </button>
          </div>
        </div>
      </nav>

      {/* ── Page body ── */}
      <div className="container">
        {/* Hero */}
        <div className="hero fade-in-up">
          <div className="hero-eyebrow">
            <Globe size={13} />
            {t.eyebrow}
          </div>
          <h1 className="title">
            <span className="title-gradient">{t.title}</span>
          </h1>
          <p className="subtitle">{t.subtitle}</p>
        </div>

        {/* Search */}
        <div className="search-wrapper fade-in-up fade-in-up-delay-1">
          <form onSubmit={handleSearch} className="search-container">
            <div className="search-input-wrapper">
              <Search className="search-icon" />
              <input
                id="search-keyword"
                type="text"
                className="search-input"
                placeholder={t.searchPlaceholder}
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                autoComplete="off"
              />
            </div>
            <button id="btn-analyze" type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <RefreshCw size={16} style={{ animation: 'spin 0.85s linear infinite' }} />
              ) : (
                <Search size={16} />
              )}
              {t.analyze}
            </button>
          </form>
        </div>

        {/* Bookmarks */}
        <div className="bookmarks-section fade-in-up fade-in-up-delay-2">
          <div className="bookmarks-row">
            <span className="bookmarks-label">
              <Bookmark size={13} />
              {t.bookmarksLabel}
            </span>

            {bookmarks.map((b) => (
              <div key={b} className={`bookmark-tag ${b === keyword ? 'active' : ''}`}>
                <span
                  onClick={() => { setSearchInput(b); setKeyword(b); }}
                  title={b}
                >
                  {b}
                </span>
                <button
                  className="bookmark-remove"
                  aria-label={`Remove ${b}`}
                  onClick={() => toggleBookmark(b)}
                >
                  ×
                </button>
              </div>
            ))}

            {!bookmarks.includes(keyword) && keyword.trim() !== '' && (
              <button id="btn-bookmark" className="bookmark-add" onClick={() => toggleBookmark(keyword)}>
                <BookmarkPlus size={13} />
                {t.bookmarkCurrent}
              </button>
            )}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Metric cards */}
        <div className="metrics-grid fade-in-up fade-in-up-delay-3">
          {/* EMA card */}
          <div
            id="card-ema"
            className={`metric-card glass-panel ${showEMA ? 'ema-active' : ''}`}
            onClick={() => setShowEMA(!showEMA)}
            role="button"
            aria-pressed={showEMA}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowEMA(!showEMA)}
          >
            <span className="metric-click-hint">{t.toggleHint}</span>
            <div
              className="metric-icon-bg"
              style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}
            >
              <TrendingUp size={18} color="var(--ema-color)" />
            </div>
            <div className="metric-header">
              <span className="metric-label">{t.ema_label} (EMA)</span>
            </div>
            <div className="metric-value" style={{ color: showEMA ? 'var(--ema-color)' : undefined }}>
              {getLatestValue('ema')}
            </div>
            <div className="metric-badge">{t.ema_sub}</div>
          </div>

          {/* RSI card */}
          <div
            id="card-rsi"
            className={`metric-card glass-panel ${showRSI ? 'rsi-active' : ''}`}
            onClick={() => setShowRSI(!showRSI)}
            role="button"
            aria-pressed={showRSI}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowRSI(!showRSI)}
          >
            <span className="metric-click-hint">{t.toggleHint}</span>
            <div
              className="metric-icon-bg"
              style={{ background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)' }}
            >
              <Activity size={18} color="var(--rsi-color)" />
            </div>
            <div className="metric-header">
              <span className="metric-label">{t.rsi_label} (RSI)</span>
            </div>
            <div className="metric-value" style={{ color: showRSI ? 'var(--rsi-color)' : undefined }}>
              {getLatestValue('rsi')}
            </div>
            <div className={`metric-badge ${rsiClass}`}>
              {rsiSignal || t.rsi_sub}
            </div>
          </div>

          {/* MACD card */}
          <div
            id="card-macd"
            className={`metric-card glass-panel ${showMACD ? 'macd-active' : ''}`}
            onClick={() => setShowMACD(!showMACD)}
            role="button"
            aria-pressed={showMACD}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setShowMACD(!showMACD)}
          >
            <span className="metric-click-hint">{t.toggleHint}</span>
            <div
              className="metric-icon-bg"
              style={{ background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)' }}
            >
              <BarChart2 size={18} color="var(--macd-color)" />
            </div>
            <div className="metric-header">
              <span className="metric-label">{t.macd_label} (MACD)</span>
            </div>
            <div className="metric-value" style={{ color: showMACD ? 'var(--macd-color)' : undefined }}>
              {getLatestValue('macd')}
            </div>
            <div className="metric-badge">{t.macd_sub}</div>
          </div>
        </div>

        {/* Chart */}
        <div className="chart-section glass-panel fade-in-up fade-in-up-delay-4">
          <div className="chart-header">
            <div className="chart-title">
              <LineChartIcon size={16} color="var(--accent-light)" />
              {t.chartTitle}
              <span className="chart-keyword">{keyword}</span>
            </div>

            {/* Inline indicator toggles in chart header */}
            <div className="chart-indicators">
              {[
                { key: 'ema',  label: 'EMA',  color: 'var(--ema-color)',  active: showEMA,  toggle: () => setShowEMA(!showEMA) },
                { key: 'rsi',  label: 'RSI',  color: 'var(--rsi-color)',  active: showRSI,  toggle: () => setShowRSI(!showRSI) },
                { key: 'macd', label: 'MACD', color: 'var(--macd-color)', active: showMACD, toggle: () => setShowMACD(!showMACD) },
              ].map(({ key, label, color, active, toggle }) => (
                <button
                  key={key}
                  id={`toggle-${key}`}
                  onClick={toggle}
                  className="indicator-pill"
                  style={{
                    borderColor: active ? color : 'var(--border-color)',
                    color:       active ? color : 'var(--text-secondary)',
                    background:  active ? `${color}15` : 'transparent',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="chart-body">
            {loading && data.length === 0 ? (
              <div className="loader-container">
                <div className="loader-icon">
                  <div className="spinner-ring" />
                  <div className="spinner-ring-2" />
                </div>
                <p className="loader-text">
                  {t.loading} <strong>&ldquo;{keyword}&rdquo;</strong>
                </p>
                <p className="loader-sub">{t.loadingSub}</p>
              </div>
            ) : data.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(99,130,255,0.06)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    tickMargin={10}
                    minTickGap={35}
                    axisLine={{ stroke: 'var(--border-color)' }}
                    tickLine={false}
                  />
                  <YAxis
                    yAxisId="left"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={36}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="var(--text-muted)"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    width={36}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-bright)', strokeWidth: 1 }} />
                  <Legend
                    wrapperStyle={{ paddingTop: '16px', fontSize: '12px', color: 'var(--text-secondary)' }}
                  />

                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="value"
                    name={t.interestLine}
                    stroke="var(--trend-color)"
                    strokeWidth={2.5}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0, fill: 'var(--trend-color)' }}
                  />
                  {showEMA && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="ema"
                      name="EMA (20)"
                      stroke="var(--ema-color)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                  {showRSI && (
                    <Line
                      yAxisId="right"
                      type="monotone"
                      dataKey="rsi"
                      name="RSI (14)"
                      stroke="var(--rsi-color)"
                      strokeWidth={2}
                      dot={false}
                      strokeDasharray="5 5"
                    />
                  )}
                  {showMACD && (
                    <Line
                      yAxisId="left"
                      type="monotone"
                      dataKey="macd"
                      name="MACD"
                      stroke="var(--macd-color)"
                      strokeWidth={2}
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <Search size={28} color="var(--accent-light)" />
                </div>
                <p className="loader-text">{t.emptyPrompt}</p>
                <p className="loader-sub">{t.emptyHint}</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>{t.footerText}</p>
        </footer>
      </div>
    </>
  );
}
