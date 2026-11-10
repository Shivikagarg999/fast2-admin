import { useEffect, useState, useCallback } from "react";
import { FiImage, FiDownload, FiTrendingUp, FiCalendar, FiLoader } from "react-icons/fi";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api`;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token') || ''}`,
  'Content-Type': 'application/json',
});

const MarketingPage = () => {
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [categoryId, setCategoryId] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [useAiBackground, setUseAiBackground] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState('');

  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const [trending, setTrending] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch(`${BASE_URL}/category/getall?isActive=true`);
        const data = await res.json();
        setCategories(Array.isArray(data) ? data : data.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const [trendingRes, occasionsRes] = await Promise.all([
        fetch(`${BASE_URL}/admin/marketing/trending-categories`, { headers: getHeaders() }),
        fetch(`${BASE_URL}/admin/marketing/upcoming-occasions`, { headers: getHeaders() }),
      ]);
      const trendingData = await trendingRes.json();
      const occasionsData = await occasionsRes.json();
      if (trendingData.success) setTrending(trendingData.data || []);
      if (occasionsData.success) setOccasions(occasionsData.data || []);
    } catch (err) {
      console.error('Error fetching marketing suggestions:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
  }, [fetchSuggestions]);

  const handleGenerate = async () => {
    if (!categoryId) {
      setError('Pick a category first.');
      return;
    }
    setGenerating(true);
    setError('');
    setResult(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/generate-post`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          categoryId,
          platform,
          useAiBackground,
          ...(useAiBackground && backgroundPrompt.trim() && { backgroundPrompt: backgroundPrompt.trim() }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
      } else {
        setError(data.message || 'Failed to generate post');
      }
    } catch {
      setError('Failed to generate post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const pickSuggestedCategory = (id) => {
    setCategoryId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center mb-6">
          <FiImage className="w-6 h-6 text-blue-600 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing — Social Posts</h1>
        </div>

        {/* Suggestions: trending categories + upcoming occasions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <FiTrendingUp className="w-4 h-4 text-green-600" /> Trending categories
            </h3>
            {loadingSuggestions ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : trending.length === 0 ? (
              <p className="text-xs text-gray-400">Not enough recent activity yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {trending.map((t) => (
                  <button
                    key={t.category._id}
                    onClick={() => pickSuggestedCategory(t.category._id)}
                    className="px-3 py-1.5 text-xs rounded-full bg-green-50 text-green-800 border border-green-200 hover:bg-green-100"
                    title={`${t.clicks} clicks, ${t.unitsSold} sold recently`}
                  >
                    {t.category.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
              <FiCalendar className="w-4 h-4 text-orange-600" /> Upcoming occasions
            </h3>
            {loadingSuggestions ? (
              <p className="text-xs text-gray-400">Loading...</p>
            ) : occasions.length === 0 ? (
              <p className="text-xs text-gray-400">Nothing in the next 30 days.</p>
            ) : (
              <div className="space-y-2">
                {occasions.map((o) => (
                  <div key={o._id} className="text-xs">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{o.emoji} {o.name}</span>
                    <span className="text-gray-400"> — in {o.daysAway} day{o.daysAway !== 1 ? 's' : ''}</span>
                    {o.suggestedCategories?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {o.suggestedCategories.map((c) => (
                          <button
                            key={c._id}
                            onClick={() => pickSuggestedCategory(c._id)}
                            className="px-2 py-1 text-[11px] rounded-full bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100"
                          >
                            {c.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Generator form */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                disabled={loadingCategories}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              >
                <option value="">{loadingCategories ? 'Loading...' : 'Select a category'}</option>
                {categories.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Platform</label>
              <div className="flex gap-2">
                {['instagram', 'facebook'].map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${
                      platform === p
                        ? 'bg-black text-white border-black'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                    }`}
                  >
                    {p === 'instagram' ? 'Instagram (1080x1080)' : 'Facebook (1200x630)'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useAiBackground}
                onChange={(e) => setUseAiBackground(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-200">Use AI-generated background</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
              The logo, products, names and prices are always placed precisely by the app — only the decorative
              background art is AI-generated, so your design stays accurate. Describe the mood/theme you want below,
              or leave blank for a sensible default.
            </p>
            {useAiBackground && (
              <textarea
                value={backgroundPrompt}
                onChange={(e) => setBackgroundPrompt(e.target.value)}
                placeholder='e.g. "Diwali themed background with diyas and warm golden light, festive and premium"'
                rows={2}
                className="w-full mt-2 ml-6 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                style={{ width: 'calc(100% - 1.5rem)' }}
              />
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{error}</div>
          )}

          <button
            onClick={handleGenerate}
            disabled={generating || !categoryId}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: 'black' }}
          >
            {generating ? (<><FiLoader className="w-4 h-4 animate-spin" /> Generating...</>) : 'Generate Post'}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-start gap-5">
              <img
                src={result.url}
                alt="Generated post"
                className="w-full sm:w-80 rounded-lg border border-gray-200 dark:border-gray-700"
              />
              <div className="flex-1">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                  {result.categoryName} — {result.platform}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Products used: {result.productsUsed.join(', ')}
                </p>
                <p className="text-xs text-gray-400 mb-4">
                  {result.usedAiBackground ? 'AI-generated background used.' : 'Standard brand background used.'}
                </p>
                <a
                  href={result.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                  style={{ backgroundColor: 'black' }}
                >
                  <FiDownload className="w-4 h-4" /> Download
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingPage;
