import { useEffect, useState, useCallback } from "react";
import { FiImage, FiDownload, FiTrendingUp, FiCalendar, FiLoader, FiZap, FiCheck, FiSend, FiAlertCircle } from "react-icons/fi";
import { FaInstagram, FaFacebook } from "react-icons/fa";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api`;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token') || ''}`,
  'Content-Type': 'application/json',
});

const MarketingPage = () => {
  const [tab, setTab] = useState('template'); // 'template' | 'lifestyle'

  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [trending, setTrending] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(true);

  // Auto-publishing common settings
  const [autoPublish, setAutoPublish] = useState(false);
  const [publishPlatforms, setPublishPlatforms] = useState(['facebook', 'instagram']);
  const [customCaption, setCustomCaption] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);

  // Daily auto-post
  const [dailyPosting, setDailyPosting] = useState(false);
  const [dailyResult, setDailyResult] = useState(null);

  // --- Template post (free, ₹0 AI cost via Satori & Pollinations FLUX) ---
  const [categoryId, setCategoryId] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [useAiBackground, setUseAiBackground] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // --- Lifestyle post (₹0 cost via FLUX) ---
  const [lsCategoryId, setLsCategoryId] = useState('');
  const [lsProducts, setLsProducts] = useState([]);
  const [loadingLsProducts, setLoadingLsProducts] = useState(false);
  const [productId, setProductId] = useState('');
  const [lsPlatform, setLsPlatform] = useState('instagram');
  const [sceneDescription, setSceneDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [lsGenerating, setLsGenerating] = useState(false);
  const [lsResult, setLsResult] = useState(null);
  const [lsError, setLsError] = useState('');

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

  useEffect(() => {
    if (!lsCategoryId) {
      setLsProducts([]);
      setProductId('');
      return;
    }
    const fetchProducts = async () => {
      setLoadingLsProducts(true);
      setProductId('');
      try {
        const res = await fetch(`${BASE_URL}/admin/marketing/category-products/${lsCategoryId}`, { headers: getHeaders() });
        const data = await res.json();
        setLsProducts(data.products || []);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingLsProducts(false);
      }
    };
    fetchProducts();
  }, [lsCategoryId]);

  const togglePlatform = (p) => {
    if (publishPlatforms.includes(p)) {
      if (publishPlatforms.length === 1) return; // Keep at least one
      setPublishPlatforms(publishPlatforms.filter((item) => item !== p));
    } else {
      setPublishPlatforms([...publishPlatforms, p]);
    }
  };

  const handleGenerate = async () => {
    if (!categoryId) {
      setError('Pick a category first.');
      return;
    }
    setGenerating(true);
    setError('');
    setResult(null);
    setPublishStatus(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/generate-post`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          categoryId,
          platform,
          useAiBackground,
          ...(useAiBackground && backgroundPrompt.trim() && { backgroundPrompt: backgroundPrompt.trim() }),
          autoPublish,
          publishPlatforms,
          ...(customCaption.trim() && { caption: customCaption.trim() }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setResult(data.data);
        if (data.data.publishResults) {
          setPublishStatus(data.data.publishResults);
        }
      } else {
        setError(data.message || 'Failed to generate post');
      }
    } catch {
      setError('Failed to generate post. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateLifestyle = async () => {
    if (!productId) {
      setLsError('Pick a product first.');
      return;
    }
    setLsGenerating(true);
    setLsError('');
    setLsResult(null);
    setPublishStatus(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/generate-lifestyle-post`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          productId,
          platform: lsPlatform,
          ...(sceneDescription.trim() && { sceneDescription: sceneDescription.trim() }),
          ...(tagline.trim() && { tagline: tagline.trim() }),
          autoPublish,
          publishPlatforms,
          ...(customCaption.trim() && { caption: customCaption.trim() }),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setLsResult(data.data);
        if (data.data.publishResults) {
          setPublishStatus(data.data.publishResults);
        }
      } else {
        setLsError(data.message || 'Failed to generate lifestyle post');
      }
    } catch {
      setLsError('Failed to generate lifestyle post. Please try again.');
    } finally {
      setLsGenerating(false);
    }
  };

  const handleManualPublish = async (imageUrl, defaultCaption) => {
    setPublishing(true);
    setPublishStatus(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/publish`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          imageUrl,
          caption: customCaption.trim() || defaultCaption,
          platforms: publishPlatforms,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPublishStatus(data.data);
      } else {
        setPublishStatus({ error: data.message || 'Failed to publish post' });
      }
    } catch {
      setPublishStatus({ error: 'Network error publishing post.' });
    } finally {
      setPublishing(false);
    }
  };

  const handleDailyAutoPost = async () => {
    if (!window.confirm("Auto-generate today's best deals post and publish directly to Facebook & Instagram?")) return;
    setDailyPosting(true);
    setDailyResult(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/auto-daily-post`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          platform: 'instagram',
          publishPlatforms: ['facebook', 'instagram'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDailyResult({ success: true, data: data.data });
      } else {
        setDailyResult({ success: false, message: data.message || 'Failed to auto post' });
      }
    } catch {
      setDailyResult({ success: false, message: 'Network error triggering daily auto-post' });
    } finally {
      setDailyPosting(false);
    }
  };

  const pickSuggestedCategory = (id) => {
    setTab('template');
    setCategoryId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const tabBtn = (key, label, icon) => (
    <button
      onClick={() => setTab(key)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
        tab === key ? 'bg-black text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
      }`}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center">
            <FiImage className="w-6 h-6 text-green-600 mr-2" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing — Social Posts</h1>
              <p className="text-xs text-gray-500">₹0 Cost Image Generation & Instant Social Publishing</p>
            </div>
          </div>

          {/* 1-Click Auto Daily Post Button */}
          <button
            onClick={handleDailyAutoPost}
            disabled={dailyPosting}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            {dailyPosting ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiZap className="w-4 h-4 text-yellow-300" />}
            {dailyPosting ? 'Auto-Publishing...' : '1-Click Daily Auto-Post'}
          </button>
        </div>

        {dailyResult && (
          <div className={`p-4 rounded-xl border mb-6 text-sm ${dailyResult.success ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
            {dailyResult.success ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <FiCheck className="w-5 h-5 text-green-600" /> Successfully auto-posted today's deals for "{dailyResult.data?.category}"!
                  </p>
                  <p className="text-xs text-green-700 mt-1">Published to Facebook & Instagram at ₹0 cost.</p>
                </div>
                {dailyResult.data?.imageUrl && (
                  <a href={dailyResult.data.imageUrl} target="_blank" rel="noreferrer" className="text-xs underline font-medium">
                    View Published Image
                  </a>
                )}
              </div>
            ) : (
              <p className="flex items-center gap-2">
                <FiAlertCircle className="w-5 h-5 text-red-600" /> {dailyResult.message}
              </p>
            )}
          </div>
        )}

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

        {/* Cost & AI Status Banner */}
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800 p-3.5 rounded-xl mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300">
            <span className="px-2 py-0.5 rounded bg-emerald-600 text-white font-bold text-[10px]">₹0 / POST</span>
            <span>Free FLUX AI is active. Zero API token charges, unlimited posts within your ₹300 monthly budget.</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabBtn('template', 'Category Deals Post (Free)', <FiImage className="w-4 h-4" />)}
          {tabBtn('lifestyle', 'AI Lifestyle Scene (Free FLUX)', <FiZap className="w-4 h-4" />)}
        </div>

        {/* Shared Auto-Publish Configuration Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoPublish}
                onChange={(e) => setAutoPublish(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded"
              />
              <span className="text-sm font-semibold text-gray-900 dark:text-white">
                Auto-Publish to Social Media upon Generation
              </span>
            </label>

            <div className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-500">Publish to:</span>
              <button
                type="button"
                onClick={() => togglePlatform('instagram')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                  publishPlatforms.includes('instagram')
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                <FaInstagram className="w-3.5 h-3.5" /> Instagram
              </button>
              <button
                type="button"
                onClick={() => togglePlatform('facebook')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                  publishPlatforms.includes('facebook')
                    ? 'bg-blue-600 text-white border-transparent'
                    : 'bg-gray-100 text-gray-600 border-gray-300'
                }`}
              >
                <FaFacebook className="w-3.5 h-3.5" /> Facebook
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Caption (Optional — leaves default if blank)
            </label>
            <input
              type="text"
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="e.g. Fresh deals! Order now on GMKart for 10-min delivery. #Grocery #FastDelivery"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
            />
          </div>
        </div>

        {tab === 'template' && (
          <>
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
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Platform Size</label>
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
                    className="w-4 h-4 text-green-600 rounded"
                  />
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Use Free AI-Generated Background (FLUX - ₹0 cost)
                  </span>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-6">
                  Real products, discounts, prices and GMKart logo are cleanly rendered by the server. Only the decorative background art is generated by FLUX.
                </p>
                {useAiBackground && (
                  <textarea
                    value={backgroundPrompt}
                    onChange={(e) => setBackgroundPrompt(e.target.value)}
                    placeholder='e.g. "Diwali themed festive background with diyas and warm golden light, premium bokeh"'
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
                {generating ? (<><FiLoader className="w-4 h-4 animate-spin" /> Generating Post...</>) : autoPublish ? 'Generate & Auto-Publish' : 'Generate Post'}
              </button>
            </div>

            {result && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  <img
                    src={result.url}
                    alt="Generated post"
                    className="w-full sm:w-80 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                  />
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                      {result.categoryName} — {result.platform}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Products featured: {result.productsUsed?.join(', ')}
                    </p>
                    <p className="text-xs text-gray-400 mb-4">
                      {result.usedAiBackground ? 'AI Background (FLUX - ₹0 cost)' : 'Standard brand vector gradient'}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <a
                        href={result.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-black"
                      >
                        <FiDownload className="w-4 h-4" /> Download Image
                      </a>

                      <button
                        onClick={() => handleManualPublish(result.url, `Fresh deals on ${result.categoryName}! 🛒 Order on GMKart for 10-15 min fast delivery. #GMKart #Grocery`)}
                        disabled={publishing}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {publishing ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                        Publish to {publishPlatforms.join(' & ')}
                      </button>
                    </div>

                    {publishStatus && (
                      <div className="mt-3 p-3 rounded-lg border text-xs bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Publish Status:</div>
                        {publishStatus.error ? (
                          <div className="text-red-600">{publishStatus.error}</div>
                        ) : (
                          Object.entries(publishStatus).map(([plt, res]) => (
                            <div key={plt} className="flex items-center gap-2 mt-0.5">
                              <span className="capitalize font-medium">{plt}:</span>
                              {res.success ? (
                                <span className="text-green-600 flex items-center gap-1 font-medium">
                                  <FiCheck className="w-3.5 h-3.5" /> Published (ID: {res.postId})
                                </span>
                              ) : (
                                <span className="text-red-500">{res.error || 'Failed'}</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {tab === 'lifestyle' && (
          <>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                  <select
                    value={lsCategoryId}
                    onChange={(e) => setLsCategoryId(e.target.value)}
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
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
                  <select
                    value={productId}
                    onChange={(e) => setProductId(e.target.value)}
                    disabled={!lsCategoryId || loadingLsProducts}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  >
                    <option value="">
                      {!lsCategoryId ? 'Pick a category first' : loadingLsProducts ? 'Loading...' : 'Select a product'}
                    </option>
                    {lsProducts.map((p) => (
                      <option key={p._id} value={p._id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Platform Size</label>
                <div className="flex gap-2">
                  {['instagram', 'facebook'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setLsPlatform(p)}
                      className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium border ${
                        lsPlatform === p
                          ? 'bg-black text-white border-black'
                          : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {p === 'instagram' ? 'Instagram (1080x1080)' : 'Facebook (1200x630)'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Scene description (optional)
                </label>
                <textarea
                  value={sceneDescription}
                  onChange={(e) => setSceneDescription(e.target.value)}
                  placeholder='e.g. "a cozy modern Indian kitchen with warm morning sunlight and fresh spices"'
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tagline (placed cleanly with official GMKart logo)
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="e.g. Fresh picks, fast delivery"
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                />
              </div>

              {lsError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{lsError}</div>
              )}

              <button
                onClick={handleGenerateLifestyle}
                disabled={lsGenerating || !productId}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                style={{ backgroundColor: 'black' }}
              >
                {lsGenerating ? (<><FiLoader className="w-4 h-4 animate-spin" /> Generating Lifestyle Scene (FLUX)...</>) : autoPublish ? 'Generate & Auto-Publish' : 'Generate Lifestyle Post'}
              </button>
            </div>

            {lsResult && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mt-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-5">
                  <img
                    src={lsResult.url}
                    alt="Generated lifestyle post"
                    className="w-full sm:w-80 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm"
                  />
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">
                      {lsResult.productName} — {lsResult.platform}
                    </h3>
                    <p className="text-xs text-emerald-600 font-medium mb-4">
                      Photorealistic FLUX scene generated at ₹0 cost.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <a
                        href={lsResult.url}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-black"
                      >
                        <FiDownload className="w-4 h-4" /> Download Image
                      </a>

                      <button
                        onClick={() => handleManualPublish(lsResult.url, `${lsResult.productName} — Order now on GMKart! ⚡ Fresh groceries delivered in minutes. #GMKart #QuickCommerce`)}
                        disabled={publishing}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        {publishing ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                        Publish to {publishPlatforms.join(' & ')}
                      </button>
                    </div>

                    {publishStatus && (
                      <div className="mt-3 p-3 rounded-lg border text-xs bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600">
                        <div className="font-semibold text-gray-800 dark:text-gray-200 mb-1">Publish Status:</div>
                        {publishStatus.error ? (
                          <div className="text-red-600">{publishStatus.error}</div>
                        ) : (
                          Object.entries(publishStatus).map(([plt, res]) => (
                            <div key={plt} className="flex items-center gap-2 mt-0.5">
                              <span className="capitalize font-medium">{plt}:</span>
                              {res.success ? (
                                <span className="text-green-600 flex items-center gap-1 font-medium">
                                  <FiCheck className="w-3.5 h-3.5" /> Published (ID: {res.postId})
                                </span>
                              ) : (
                                <span className="text-red-500">{res.error || 'Failed'}</span>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MarketingPage;
