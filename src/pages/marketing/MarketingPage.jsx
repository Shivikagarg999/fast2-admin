import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
  FiImage,
  FiDownload,
  FiTrendingUp,
  FiCalendar,
  FiLoader,
  FiZap,
  FiCheck,
  FiSend,
  FiAlertCircle,
  FiCheckSquare,
  FiSquare,
  FiClock,
  FiPlay,
  FiSettings,
  FiRefreshCw,
  FiCheckCircle,
  FiXCircle,
  FiMessageCircle,
  FiBell,
  FiTag,
  FiGrid,
  FiTrash2,
  FiExternalLink,
  FiX
} from "react-icons/fi";
import { FaInstagram, FaFacebook } from "react-icons/fa";

// Sub-components integrated into the Unified Marketing Hub
import WhatsappInboxPage from "../whatsapp/WhatsappInboxPage";
import NotificationsPage from "../notifications/NotificationsPage";
import Coupon from "../coupon-code/CouponCode";
import Banners from "../banners/Banners";

const BASE_URL = `${(import.meta.env.DEV ? import.meta.env.VITE_BASE_URL : null) || 'https://admin.gmkart.com/proxy'}/api`;

const getHeaders = () => ({
  Authorization: `Bearer ${localStorage.getItem('adminToken') || localStorage.getItem('token') || ''}`,
  'Content-Type': 'application/json',
});

const MarketingPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTab = searchParams.get('tab') || 'posts';

  // Normalize main tab: 'posts' | 'autopost' | 'scheduled' | 'whatsapp' | 'notifications' | 'coupons' | 'banners'
  const mainTab = (rawTab === 'autopost' || rawTab === 'scheduled') ? 'posts' : rawTab;

  // Sub-tab inside Social Posts: 'template' | 'lifestyle' | 'autopost' | 'scheduled'
  const [socialSubTab, setSocialSubTab] = useState(
    rawTab === 'autopost' ? 'autopost' : rawTab === 'scheduled' ? 'scheduled' : 'template'
  );

  useEffect(() => {
    if (rawTab === 'autopost') {
      setSocialSubTab('autopost');
    } else if (rawTab === 'scheduled') {
      setSocialSubTab('scheduled');
    } else if (rawTab === 'posts') {
      if (socialSubTab === 'autopost' || socialSubTab === 'scheduled') setSocialSubTab('template');
    }
  }, [rawTab]);

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

  // --- Auto-Post Scheduler tab state ---
  const [autoConfig, setAutoConfig] = useState({
    isEnabled: false,
    scheduledTime: "10:00",
    platforms: ["facebook", "instagram"],
    postType: "category-deals",
    customCaption: ""
  });
  const [autoLogs, setAutoLogs] = useState([]);
  const [loadingAutoConfig, setLoadingAutoConfig] = useState(false);
  const [savingAutoConfig, setSavingAutoConfig] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(null);
  const [triggeringNow, setTriggeringNow] = useState(false);
  const [triggerFeedback, setTriggerFeedback] = useState(null);

  // --- Template post (free, ₹0 AI cost via Satori & Pollinations FLUX) ---
  const [categoryId, setCategoryId] = useState('');
  const [platform, setPlatform] = useState('instagram');
  const [useAiBackground, setUseAiBackground] = useState(false);
  const [backgroundPrompt, setBackgroundPrompt] = useState('');
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // --- Lifestyle post (₹0 cost via FLUX, Multi-Product Selection) ---
  const [lsCategoryId, setLsCategoryId] = useState('');
  const [lsProducts, setLsProducts] = useState([]);
  const [loadingLsProducts, setLoadingLsProducts] = useState(false);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [lsPlatform, setLsPlatform] = useState('instagram');
  const [sceneDescription, setSceneDescription] = useState('');
  const [tagline, setTagline] = useState('');
  const [useGemini, setUseGemini] = useState(false); // Strictly disabled by default
  const [lsGenerating, setLsGenerating] = useState(false);
  const [lsResult, setLsResult] = useState(null);
  const [lsError, setLsError] = useState('');

  // --- One-off Scheduled Posts state ---
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loadingScheduledPosts, setLoadingScheduledPosts] = useState(false);
  const [scheduledFilter, setScheduledFilter] = useState('all');
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [scheduleForm, setScheduleForm] = useState({
    imageUrl: '',
    caption: '',
    title: '',
    postType: 'lifestyle',
    platforms: ['facebook', 'instagram'],
    scheduledAt: ''
  });
  const [submittingSchedule, setSubmittingSchedule] = useState(false);
  const [scheduleFeedback, setScheduleFeedback] = useState(null);
  const [actionPostId, setActionPostId] = useState(null);

  const getLocalDatetimeString = (date) => {
    const pad = (n) => String(n).padStart(2, '0');
    const y = date.getFullYear();
    const m = pad(date.getMonth() + 1);
    const d = pad(date.getDate());
    const hh = pad(date.getHours());
    const mm = pad(date.getMinutes());
    return `${y}-${m}-${d}T${hh}:${mm}`;
  };

  const openScheduleModal = ({ imageUrl, caption = '', title = '', postType = 'lifestyle', platforms = ['facebook', 'instagram'] }) => {
    const nextHour = new Date(Date.now() + 60 * 60 * 1000);
    setScheduleForm({
      imageUrl,
      caption,
      title,
      postType,
      platforms: platforms && platforms.length ? platforms : ['facebook', 'instagram'],
      scheduledAt: getLocalDatetimeString(nextHour)
    });
    setScheduleFeedback(null);
    setScheduleModalOpen(true);
  };

  const setQuickScheduleTime = (hoursToAdd, exactHour = null) => {
    const target = new Date();
    if (exactHour !== null) {
      if (hoursToAdd > 0) {
        target.setDate(target.getDate() + 1);
      }
      target.setHours(exactHour, 0, 0, 0);
    } else {
      target.setTime(target.getTime() + hoursToAdd * 60 * 60 * 1000);
    }
    setScheduleForm((prev) => ({
      ...prev,
      scheduledAt: getLocalDatetimeString(target)
    }));
  };

  const fetchScheduledPosts = useCallback(async () => {
    setLoadingScheduledPosts(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/scheduled-posts?status=${scheduledFilter}`, {
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        setScheduledPosts(data.data.posts || []);
      }
    } catch (err) {
      console.error('Error fetching scheduled posts:', err);
    } finally {
      setLoadingScheduledPosts(false);
    }
  }, [scheduledFilter]);

  useEffect(() => {
    if (socialSubTab === 'scheduled') {
      fetchScheduledPosts();
    }
  }, [socialSubTab, scheduledFilter, fetchScheduledPosts]);

  const handleConfirmSchedule = async (e) => {
    if (e) e.preventDefault();
    if (!scheduleForm.imageUrl) {
      setScheduleFeedback({ type: 'error', message: 'Image URL is required' });
      return;
    }
    if (!scheduleForm.scheduledAt) {
      setScheduleFeedback({ type: 'error', message: 'Please select a scheduled date and time' });
      return;
    }

    setSubmittingSchedule(true);
    setScheduleFeedback(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/schedule-post`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          ...scheduleForm,
          scheduledAt: new Date(scheduleForm.scheduledAt).toISOString()
        })
      });
      const data = await res.json();
      if (data.success) {
        setScheduleFeedback({
          type: 'success',
          message: `Post successfully scheduled for ${new Date(scheduleForm.scheduledAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}!`
        });
        setTimeout(() => {
          setScheduleModalOpen(false);
          setSocialSubTab('scheduled');
          fetchScheduledPosts();
        }, 1200);
      } else {
        setScheduleFeedback({ type: 'error', message: data.message || 'Failed to schedule post' });
      }
    } catch (err) {
      setScheduleFeedback({ type: 'error', message: err.message || 'Network error' });
    } finally {
      setSubmittingSchedule(false);
    }
  };

  const handleCancelScheduled = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this scheduled post?')) return;
    setActionPostId(id);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/scheduled-posts/${id}`, {
        method: 'DELETE',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        fetchScheduledPosts();
      } else {
        alert(data.message || 'Failed to cancel');
      }
    } catch (err) {
      console.error('Cancel error:', err);
    } finally {
      setActionPostId(null);
    }
  };

  const handlePublishScheduledNow = async (id) => {
    if (!window.confirm('Publish this post immediately to selected platforms?')) return;
    setActionPostId(id);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/scheduled-posts/${id}/publish-now`, {
        method: 'POST',
        headers: getHeaders()
      });
      const data = await res.json();
      if (data.success) {
        alert('Post published successfully!');
        fetchScheduledPosts();
      } else {
        alert(data.message || 'Publishing had errors');
        fetchScheduledPosts();
      }
    } catch (err) {
      console.error('Publish now error:', err);
    } finally {
      setActionPostId(null);
    }
  };

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

  const fetchAutoPostConfig = useCallback(async () => {
    setLoadingAutoConfig(true);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/auto-post-config`, { headers: getHeaders() });
      const data = await res.json();
      if (data.success && data.data) {
        if (data.data.config) setAutoConfig(data.data.config);
        if (data.data.recentLogs) setAutoLogs(data.data.recentLogs);
      }
    } catch (err) {
      console.error('Error fetching auto-post config:', err);
    } finally {
      setLoadingAutoConfig(false);
    }
  }, []);

  useEffect(() => {
    fetchSuggestions();
    fetchAutoPostConfig();
  }, [fetchSuggestions, fetchAutoPostConfig]);

  useEffect(() => {
    if (!lsCategoryId) {
      setLsProducts([]);
      setSelectedProductIds([]);
      return;
    }
    const fetchProducts = async () => {
      setLoadingLsProducts(true);
      setSelectedProductIds([]);
      try {
        const res = await fetch(`${BASE_URL}/admin/marketing/category-products/${lsCategoryId}`, { headers: getHeaders() });
        const data = await res.json();
        const prods = data.products || [];
        setLsProducts(prods);
        if (prods.length > 0) {
          setSelectedProductIds([prods[0]._id]);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoadingLsProducts(false);
      }
    };
    fetchProducts();
  }, [lsCategoryId]);

  const toggleProductSelect = (id) => {
    if (selectedProductIds.includes(id)) {
      setSelectedProductIds(selectedProductIds.filter((pId) => pId !== id));
    } else {
      if (selectedProductIds.length >= 4) {
        alert("You can select up to 4 products for one advertisement post.");
        return;
      }
      setSelectedProductIds([...selectedProductIds, id]);
    }
  };

  const togglePlatform = (p) => {
    if (publishPlatforms.includes(p)) {
      if (publishPlatforms.length === 1) return;
      setPublishPlatforms(publishPlatforms.filter((item) => item !== p));
    } else {
      setPublishPlatforms([...publishPlatforms, p]);
    }
  };

  const toggleAutoConfigPlatform = (p) => {
    const list = autoConfig.platforms || [];
    if (list.includes(p)) {
      if (list.length === 1) return;
      setAutoConfig({ ...autoConfig, platforms: list.filter((item) => item !== p) });
    } else {
      setAutoConfig({ ...autoConfig, platforms: [...list, p] });
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
          useGemini,
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
    if (selectedProductIds.length === 0) {
      setLsError('Please select at least one product.');
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
          productId: selectedProductIds[0],
          productIds: selectedProductIds,
          platform: lsPlatform,
          useGemini,
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

  const handleSaveAutoConfig = async () => {
    setSavingAutoConfig(true);
    setSaveFeedback(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/auto-post-config`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(autoConfig),
      });
      const data = await res.json();
      if (data.success) {
        setSaveFeedback({ type: 'success', message: 'Auto-Post schedule updated successfully!' });
        if (data.data) setAutoConfig(data.data);
      } else {
        setSaveFeedback({ type: 'error', message: data.message || 'Failed to save settings' });
      }
    } catch {
      setSaveFeedback({ type: 'error', message: 'Network error saving settings' });
    } finally {
      setSavingAutoConfig(false);
    }
  };

  const handleTriggerAutoPostNow = async () => {
    if (!window.confirm("Trigger automated post immediately to Facebook & Instagram?")) return;
    setTriggeringNow(true);
    setTriggerFeedback(null);
    try {
      const res = await fetch(`${BASE_URL}/admin/marketing/auto-post-trigger`, {
        method: 'POST',
        headers: getHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        setTriggerFeedback({ type: 'success', data: data.data });
        fetchAutoPostConfig();
      } else {
        setTriggerFeedback({ type: 'error', message: data.message || 'Auto-post failed' });
      }
    } catch {
      setTriggerFeedback({ type: 'error', message: 'Network error triggering auto-post' });
    } finally {
      setTriggeringNow(false);
    }
  };

  const pickSuggestedCategory = (id) => {
    setSocialSubTab('template');
    setCategoryId(id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const switchMainTab = (newTab) => {
    setSearchParams({ tab: newTab });
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-900 w-full min-h-screen">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center">
            <FiTrendingUp className="w-6 h-6 text-green-600 mr-2" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Marketing Hub</h1>
              <p className="text-xs text-gray-500">Centralized Marketing Command: Social Auto-Post, WhatsApp, Notifications, Coupons & Banners</p>
            </div>
          </div>

          {(mainTab === 'posts' || mainTab === 'autopost') && (
            <button
              onClick={handleTriggerAutoPostNow}
              disabled={triggeringNow}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white rounded-lg text-sm font-semibold shadow-sm disabled:opacity-50"
            >
              {triggeringNow ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiPlay className="w-4 h-4 fill-current" />}
              {triggeringNow ? 'Auto-Posting Now...' : 'Run Auto-Post Now'}
            </button>
          )}
        </div>

        {/* Master Marketing Subtabs Navigation Bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 mb-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => switchMainTab('posts')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mainTab === 'posts' || mainTab === 'autopost'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              <FiImage className="w-4 h-4 text-emerald-500" /> Social Posts & Auto-Post
            </button>

            <button
              onClick={() => switchMainTab('whatsapp')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mainTab === 'whatsapp'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              <FiMessageCircle className="w-4 h-4 text-green-500" /> WhatsApp Inbox
            </button>

            <button
              onClick={() => switchMainTab('notifications')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mainTab === 'notifications'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              <FiBell className="w-4 h-4 text-blue-500" /> Push Notifications
            </button>

            <button
              onClick={() => switchMainTab('coupons')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mainTab === 'coupons'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              <FiTag className="w-4 h-4 text-orange-500" /> Coupon Codes
            </button>

            <button
              onClick={() => switchMainTab('banners')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                mainTab === 'banners'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
              }`}
            >
              <FiGrid className="w-4 h-4 text-purple-500" /> App Banners
            </button>
          </div>
        </div>

        {/* ================= VIEW 1: WHATSAPP INBOX ================= */}
        {mainTab === 'whatsapp' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 shadow-sm">
            <WhatsappInboxPage />
          </div>
        )}

        {/* ================= VIEW 2: NOTIFICATIONS ================= */}
        {mainTab === 'notifications' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 shadow-sm">
            <NotificationsPage />
          </div>
        )}

        {/* ================= VIEW 3: COUPONS ================= */}
        {mainTab === 'coupons' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 shadow-sm">
            <Coupon />
          </div>
        )}

        {/* ================= VIEW 4: BANNERS ================= */}
        {mainTab === 'banners' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-2 sm:p-4 shadow-sm">
            <Banners />
          </div>
        )}

        {/* ================= VIEW 5: SOCIAL POSTS & AUTO-POST ================= */}
        {(mainTab === 'posts' || mainTab === 'autopost') && (
          <>
            {triggerFeedback && (
              <div className={`p-4 rounded-xl border mb-6 text-sm ${triggerFeedback.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
                {triggerFeedback.type === 'success' ? (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold flex items-center gap-2">
                        <FiCheck className="w-5 h-5 text-green-600" /> Auto-Post executed successfully!
                      </p>
                      <p className="text-xs text-green-700 mt-1">
                        "{triggerFeedback.data?.title}" published to {triggerFeedback.data?.platforms?.join(' & ')}.
                      </p>
                    </div>
                    {triggerFeedback.data?.imageUrl && (
                      <a href={triggerFeedback.data.imageUrl} target="_blank" rel="noreferrer" className="text-xs underline font-medium">
                        View Published Image
                      </a>
                    )}
                  </div>
                ) : (
                  <p className="flex items-center gap-2">
                    <FiAlertCircle className="w-5 h-5 text-red-600" /> {triggerFeedback.message}
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
                <span>FLUX AI engine is active. Gemini remains strictly disabled unless selected.</span>
              </div>
              {autoConfig.isEnabled && (
                <span className="flex items-center gap-1.5 text-xs text-green-700 font-semibold bg-green-100 px-2.5 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse" /> Daily Auto-Post Active ({autoConfig.scheduledTime} IST)
                </span>
              )}
            </div>

            {/* Social Feature Subtabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              <button
                onClick={() => setSocialSubTab('template')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  socialSubTab === 'template' ? 'bg-black text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <FiImage className="w-4 h-4" /> Category Deals Post (Free)
              </button>

              <button
                onClick={() => setSocialSubTab('lifestyle')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  socialSubTab === 'lifestyle' ? 'bg-black text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <FiZap className="w-4 h-4" /> AI Lifestyle Scene (Multi-Product FLUX)
              </button>

              <button
                onClick={() => setSocialSubTab('autopost')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  socialSubTab === 'autopost' ? 'bg-black text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <FiClock className="w-4 h-4" /> 🤖 Daily Auto-Post (IST)
              </button>

              <button
                onClick={() => setSocialSubTab('scheduled')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium ${
                  socialSubTab === 'scheduled' ? 'bg-black text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600'
                }`}
              >
                <FiCalendar className="w-4 h-4 text-purple-500" /> 📅 Scheduled Posts Queue
              </button>
            </div>

            {/* ================= SUBTAB: AUTO-POST SCHEDULER ================= */}
            {socialSubTab === 'autopost' && (
              <div className="space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-700 gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiClock className="w-5 h-5 text-emerald-600" /> Automated Social Media Scheduler
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Automatically generates marketing posts at ₹0 cost and publishes directly to Instagram & Facebook Page on a daily schedule.
                      </p>
                    </div>

                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        {autoConfig.isEnabled ? 'Scheduler ENABLED' : 'Scheduler DISABLED'}
                      </span>
                      <div
                        onClick={() => setAutoConfig({ ...autoConfig, isEnabled: !autoConfig.isEnabled })}
                        className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer ${
                          autoConfig.isEnabled ? 'bg-emerald-600 justify-end' : 'bg-gray-300 dark:bg-gray-600 justify-start'
                        }`}
                      >
                        <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
                      </div>
                    </label>
                  </div>

                  {saveFeedback && (
                    <div className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                      saveFeedback.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {saveFeedback.type === 'success' ? <FiCheckCircle className="w-4 h-4 text-green-600" /> : <FiAlertCircle className="w-4 h-4 text-red-600" />}
                      {saveFeedback.message}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Daily Posting Time (IST)
                      </label>
                      <input
                        type="time"
                        value={autoConfig.scheduledTime}
                        onChange={(e) => setAutoConfig({ ...autoConfig, scheduledTime: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                      />
                      <p className="text-[11px] text-gray-400 mt-1">
                        System automatically posts every day at this exact time (Indian Standard Time).
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                        Target Social Media Platforms
                      </label>
                      <div className="flex gap-2.5">
                        <button
                          type="button"
                          onClick={() => toggleAutoConfigPlatform('instagram')}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border ${
                            autoConfig.platforms?.includes('instagram')
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white border-transparent'
                              : 'bg-white dark:bg-gray-700 text-gray-600 border-gray-300'
                          }`}
                        >
                          <FaInstagram className="w-4 h-4" /> Instagram
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleAutoConfigPlatform('facebook')}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border ${
                            autoConfig.platforms?.includes('facebook')
                              ? 'bg-blue-600 text-white border-transparent'
                              : 'bg-white dark:bg-gray-700 text-gray-600 border-gray-300'
                          }`}
                        >
                          <FaFacebook className="w-4 h-4" /> Facebook Page
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                      Content Strategy
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setAutoConfig({ ...autoConfig, postType: 'category-deals' })}
                        className={`p-3 rounded-lg border cursor-pointer ${
                          autoConfig.postType === 'category-deals'
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <FiImage className="w-3.5 h-3.5 text-emerald-600" /> Category Deals (Recommended)
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Picks top trending category, best-selling deals & creates a high-converting 4-product promo poster.
                        </p>
                      </div>

                      <div
                        onClick={() => setAutoConfig({ ...autoConfig, postType: 'lifestyle-scene' })}
                        className={`p-3 rounded-lg border cursor-pointer ${
                          autoConfig.postType === 'lifestyle-scene'
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-semibold text-xs flex items-center gap-1.5">
                          <FiZap className="w-3.5 h-3.5 text-orange-600" /> AI Lifestyle Scene
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">
                          Picks a top discount product and generates a photorealistic FLUX kitchen scene with branding.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Custom Caption Template (Optional)
                    </label>
                    <input
                      type="text"
                      value={autoConfig.customCaption}
                      onChange={(e) => setAutoConfig({ ...autoConfig, customCaption: e.target.value })}
                      placeholder="Leave empty for smart auto-caption with hashtags, or use {category} / {product}"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
                    <span className="text-xs text-gray-400">
                      Last Run: {autoConfig.lastRunAt ? new Date(autoConfig.lastRunAt).toLocaleString('en-IN') : 'Never'}
                    </span>
                    <button
                      onClick={handleSaveAutoConfig}
                      disabled={savingAutoConfig}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-xs font-semibold bg-black disabled:opacity-50"
                    >
                      {savingAutoConfig ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiCheck className="w-4 h-4" />}
                      {savingAutoConfig ? 'Saving...' : 'Save Auto-Post Settings'}
                    </button>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <FiCalendar className="w-4 h-4 text-emerald-600" /> Recent Auto-Post History
                    </h3>
                    <button
                      onClick={fetchAutoPostConfig}
                      disabled={loadingAutoConfig}
                      className="flex items-center gap-1 text-xs text-gray-500 hover:text-black dark:hover:text-white"
                    >
                      <FiRefreshCw className={`w-3.5 h-3.5 ${loadingAutoConfig ? 'animate-spin' : ''}`} /> Refresh
                    </button>
                  </div>

                  {autoLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-6">
                      No automated posts recorded yet. Click "Run Auto-Post Now" to trigger your first post!
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-400">
                            <th className="py-2 px-2">Image</th>
                            <th className="py-2 px-2">Date & Time</th>
                            <th className="py-2 px-2">Title</th>
                            <th className="py-2 px-2">Trigger</th>
                            <th className="py-2 px-2">Instagram</th>
                            <th className="py-2 px-2">Facebook</th>
                            <th className="py-2 px-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                          {autoLogs.map((log) => (
                            <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                              <td className="py-2 px-2">
                                {log.imageUrl ? (
                                  <a href={log.imageUrl} target="_blank" rel="noreferrer">
                                    <img src={log.imageUrl} alt="post" className="w-10 h-10 rounded object-cover border" />
                                  </a>
                                ) : (
                                  <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center text-[10px] text-gray-400">N/A</div>
                                )}
                              </td>
                              <td className="py-2 px-2 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                {new Date(log.runAt || log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                              </td>
                              <td className="py-2 px-2 font-medium text-gray-800 dark:text-gray-200 max-w-xs truncate" title={log.title}>
                                {log.title || log.categoryName || 'Auto Post'}
                              </td>
                              <td className="py-2 px-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
                                  log.triggerType === 'manual' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                }`}>
                                  {log.triggerType || 'cron'}
                                </span>
                              </td>
                              <td className="py-2 px-2">
                                {log.publishResults?.instagram?.success ? (
                                  <span className="text-green-600 font-semibold flex items-center gap-1">
                                    <FiCheck className="w-3.5 h-3.5" /> Posted
                                  </span>
                                ) : log.publishResults?.instagram?.error ? (
                                  <span className="text-red-500 truncate block max-w-[120px]" title={log.publishResults.instagram.error}>
                                    ❌ Failed
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                {log.publishResults?.facebook?.success ? (
                                  <span className="text-green-600 font-semibold flex items-center gap-1">
                                    <FiCheck className="w-3.5 h-3.5" /> Posted
                                  </span>
                                ) : log.publishResults?.facebook?.error ? (
                                  <span className="text-red-500 truncate block max-w-[120px]" title={log.publishResults.facebook.error}>
                                    ❌ Failed
                                  </span>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="py-2 px-2">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                  log.status === 'success' ? 'bg-green-100 text-green-800' : log.status === 'partial' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {log.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================= SUBTAB: TEMPLATE GENERATOR ================= */}
            {socialSubTab === 'template' && (
              <>
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
                      placeholder="e.g. Fresh grocery deals! Order now on GMKart for 10-min delivery. #Grocery #FastDelivery"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

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
                            download="gmkart-deals.png"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors cursor-pointer"
                            style={{ textDecoration: 'none' }}
                          >
                            <FiDownload className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                            <span className="font-semibold text-gray-800 dark:text-gray-100">Download Image</span>
                          </a>

                          <button
                            onClick={() => handleManualPublish(result.url, customCaption || `Fresh deals on ${result.categoryName}! 🛒 Order on GMKart for 10-15 min fast delivery. #GMKart #Grocery`)}
                            disabled={publishing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {publishing ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                            Publish to {publishPlatforms.join(' & ')}
                          </button>

                          <button
                            type="button"
                            onClick={() => openScheduleModal({
                              imageUrl: result.url,
                              caption: customCaption || `Fresh deals on ${result.categoryName}! 🛒 Order on GMKart for 10-15 min fast delivery. #GMKart #Grocery`,
                              title: `${result.categoryName} — ${result.platform}`,
                              postType: 'template',
                              platforms: publishPlatforms
                            })}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 shadow-sm transition-colors cursor-pointer"
                          >
                            <FiClock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold">Schedule Post (Date/Time)</span>
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

            {/* ================= SUBTAB: LIFESTYLE GENERATOR ================= */}
            {socialSubTab === 'lifestyle' && (
              <>
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
                      placeholder="e.g. Fresh grocery deals! Order now on GMKart for 10-min delivery. #Grocery #FastDelivery"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs"
                    />
                  </div>
                </div>

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
                  </div>

                  {/* Multiple Products Selection Grid */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Select Products for Scene (Select 1 to 4 products)
                      </label>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        {selectedProductIds.length} / 4 Selected
                      </span>
                    </div>

                    {!lsCategoryId ? (
                      <p className="text-xs text-gray-400 py-3 text-center border border-dashed rounded-lg">
                        Select a category above to choose products
                      </p>
                    ) : loadingLsProducts ? (
                      <p className="text-xs text-gray-400 py-3 text-center">Loading products...</p>
                    ) : lsProducts.length === 0 ? (
                      <p className="text-xs text-gray-400 py-3 text-center">No active products in this category.</p>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto p-1 border rounded-lg dark:border-gray-700">
                        {lsProducts.map((p) => {
                          const isSelected = selectedProductIds.includes(p._id);
                          const imgUrl = p.images?.find((img) => img.isPrimary)?.url || p.images?.[0]?.url;
                          return (
                            <div
                              key={p._id}
                              onClick={() => toggleProductSelect(p._id)}
                              className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                                isSelected
                                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
                                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                              }`}
                            >
                              {isSelected ? (
                                <FiCheckSquare className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                              ) : (
                                <FiSquare className="w-4 h-4 text-gray-400 flex-shrink-0" />
                              )}
                              {imgUrl ? (
                                <img src={imgUrl} alt={p.name} className="w-8 h-8 rounded object-contain bg-white flex-shrink-0" />
                              ) : (
                                <div className="w-8 h-8 rounded bg-gray-200 flex-shrink-0" />
                              )}
                              <span className="text-xs font-medium truncate" title={p.name}>
                                {p.name}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Scene description (optional)
                    </label>
                    <textarea
                      value={sceneDescription}
                      onChange={(e) => setSceneDescription(e.target.value)}
                      placeholder='e.g. "a cozy modern Indian kitchen with warm morning sunlight and breakfast table"'
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
                      placeholder="e.g. Fresh combo deals, 10-min fast delivery"
                      className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                    />
                  </div>

                  {/* Gemini strictly disabled toggle */}
                  <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useGemini}
                        onChange={(e) => setUseGemini(e.target.checked)}
                        className="w-4 h-4 text-orange-600 rounded"
                      />
                      <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                        Use Gemini API (Paid - Consumes Tokens)
                      </span>
                    </label>
                    <p className="text-[11px] text-gray-400 mt-0.5 ml-6">
                      {useGemini
                        ? '⚠️ Gemini is enabled for this call and will consume paid API tokens.'
                        : '🛡️ Gemini is disabled. Generation will use 100% Free FLUX AI with ₹0 cost.'}
                    </p>
                  </div>

                  {lsError && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">{lsError}</div>
                  )}

                  <button
                    onClick={handleGenerateLifestyle}
                    disabled={lsGenerating || selectedProductIds.length === 0}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: 'black' }}
                  >
                    {lsGenerating ? (
                      <><FiLoader className="w-4 h-4 animate-spin" /> Generating Lifestyle Scene ({useGemini ? 'Gemini' : 'FLUX'})...</>
                    ) : autoPublish ? (
                      `Generate (${selectedProductIds.length} Products) & Auto-Publish`
                    ) : (
                      `Generate Lifestyle Post (${selectedProductIds.length} Products)`
                    )}
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
                          {lsResult.productNames?.join(', ') || lsResult.productName} — {lsResult.platform}
                        </h3>
                        <p className="text-xs text-emerald-600 font-medium mb-4">
                          {lsResult.usedGemini ? 'Generated via Gemini (Paid)' : 'Photorealistic FLUX scene generated at ₹0 cost.'}
                        </p>

                        <div className="flex flex-wrap items-center gap-3 mb-4">
                          <a
                            href={lsResult.url}
                            download="gmkart-lifestyle-post.png"
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-600 shadow-sm transition-colors cursor-pointer"
                            style={{ textDecoration: 'none' }}
                          >
                            <FiDownload className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                            <span className="font-semibold text-gray-800 dark:text-gray-100">Download Image</span>
                          </a>

                          <button
                            onClick={() => handleManualPublish(
                              lsResult.url,
                              customCaption || `${lsResult.productNames?.join(' & ') || lsResult.productName} — Order now on GMKart! ⚡ Fresh groceries delivered in minutes. #GMKart #QuickCommerce`
                            )}
                            disabled={publishing}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors shadow-sm"
                          >
                            {publishing ? <FiLoader className="w-4 h-4 animate-spin" /> : <FiSend className="w-4 h-4" />}
                            Publish to {publishPlatforms.join(' & ')}
                          </button>

                          <button
                            type="button"
                            onClick={() => openScheduleModal({
                              imageUrl: lsResult.url,
                              caption: customCaption || `${lsResult.productNames?.join(' & ') || lsResult.productName} — Order now on GMKart! ⚡ Fresh groceries delivered in minutes. #GMKart #QuickCommerce`,
                              title: `${lsResult.productNames?.join(', ') || lsResult.productName} — ${lsResult.platform}`,
                              postType: 'lifestyle',
                              platforms: publishPlatforms
                            })}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-purple-300 dark:border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/50 shadow-sm transition-colors cursor-pointer"
                          >
                            <FiClock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span className="font-semibold">Schedule Post (Date/Time)</span>
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

            {/* ================= SUBTAB: SCHEDULED POSTS QUEUE ================= */}
            {socialSubTab === 'scheduled' && (
              <div className="space-y-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <FiCalendar className="w-5 h-5 text-purple-600" /> Scheduled Posts Queue
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Posts in this queue will automatically publish to Facebook and Instagram at their scheduled date and time.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchScheduledPosts}
                        disabled={loadingScheduledPosts}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50"
                      >
                        <FiRefreshCw className={`w-3.5 h-3.5 ${loadingScheduledPosts ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    </div>
                  </div>

                  {/* Filter Pills */}
                  <div className="flex flex-wrap gap-1.5 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                    {[
                      { key: 'all', label: 'All Posts' },
                      { key: 'scheduled', label: '⏰ Scheduled (Pending)' },
                      { key: 'published', label: '✅ Published' },
                      { key: 'failed', label: '❌ Failed' },
                      { key: 'cancelled', label: 'Cancelled' },
                    ].map((f) => (
                      <button
                        key={f.key}
                        onClick={() => setScheduledFilter(f.key)}
                        className={`px-3 py-1 text-xs rounded-full font-medium transition-colors ${
                          scheduledFilter === f.key
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                        }`}
                      >
                        {f.label}
                      </button>
                    ))}
                  </div>
                </div>

                {loadingScheduledPosts ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <FiLoader className="w-8 h-8 animate-spin text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Loading scheduled posts...</p>
                  </div>
                ) : scheduledPosts.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
                    <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-900/30 text-purple-600 mx-auto flex items-center justify-center mb-3">
                      <FiCalendar className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      No posts found in this queue
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-md mx-auto mb-4">
                      Go to "Category Deals" or "AI Lifestyle Scene", generate a post, and click "Schedule Post (Date/Time)" to queue it for automated publishing at your chosen date and time!
                    </p>
                    <button
                      onClick={() => setSocialSubTab('lifestyle')}
                      className="px-4 py-2 rounded-lg bg-black text-white text-xs font-semibold hover:bg-gray-800 transition-colors"
                    >
                      Create a Post Now
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {scheduledPosts.map((post) => {
                      const scheduledDate = new Date(post.scheduledAt);
                      const formattedTime = scheduledDate.toLocaleString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true
                      });

                      return (
                        <div
                          key={post._id}
                          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top Image & Badges */}
                            <div className="relative aspect-square bg-gray-100 dark:bg-gray-900">
                              <img
                                src={post.imageUrl}
                                alt={post.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-2 left-2 flex gap-1">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shadow-sm ${
                                  post.status === 'scheduled'
                                    ? 'bg-amber-500 text-white'
                                    : post.status === 'published'
                                    ? 'bg-green-600 text-white'
                                    : post.status === 'failed'
                                    ? 'bg-red-600 text-white'
                                    : post.status === 'processing'
                                    ? 'bg-blue-600 text-white animate-pulse'
                                    : 'bg-gray-500 text-white'
                                }`}>
                                  {post.status}
                                </span>
                              </div>

                              <a
                                href={post.imageUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
                                title="Open full image"
                              >
                                <FiExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>

                            {/* Card Content */}
                            <div className="p-4 space-y-2.5">
                              <h4 className="text-sm font-semibold text-gray-900 dark:text-white line-clamp-1">
                                {post.title}
                              </h4>

                              <div className="flex items-center gap-1.5 text-xs text-purple-700 dark:text-purple-400 font-medium">
                                <FiClock className="w-3.5 h-3.5" />
                                <span>{formattedTime}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {post.platforms?.map((plt) => (
                                  <span
                                    key={plt}
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium ${
                                      plt === 'instagram'
                                        ? 'bg-pink-50 text-pink-700 border border-pink-200'
                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                    }`}
                                  >
                                    {plt === 'instagram' ? <FaInstagram className="w-3 h-3" /> : <FaFacebook className="w-3 h-3" />}
                                    <span className="capitalize">{plt}</span>
                                  </span>
                                ))}
                              </div>

                              {post.caption && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 bg-gray-50 dark:bg-gray-700/50 p-2 rounded border border-gray-100 dark:border-gray-700">
                                  {post.caption}
                                </p>
                              )}

                              {/* Error or Publish status info */}
                              {post.status === 'failed' && post.error && (
                                <div className="text-[11px] text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200">
                                  ❌ Error: {post.error}
                                </div>
                              )}

                              {post.status === 'published' && post.publishResults && (
                                <div className="text-[11px] text-green-700 bg-green-50 dark:bg-green-950/20 p-2 rounded border border-green-200">
                                  {Object.entries(post.publishResults).map(([plt, res]) => (
                                    <div key={plt} className="truncate">
                                      <span className="font-semibold capitalize">{plt}:</span> {res.success ? `✅ ID: ${res.postId || 'OK'}` : `❌ ${res.error}`}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="p-4 pt-0 border-t border-gray-100 dark:border-gray-700 mt-2 flex items-center justify-between gap-2">
                            {post.status === 'scheduled' && (
                              <>
                                <button
                                  onClick={() => handlePublishScheduledNow(post._id)}
                                  disabled={actionPostId === post._id}
                                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-sm"
                                >
                                  {actionPostId === post._id ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiSend className="w-3.5 h-3.5" />}
                                  Publish Now
                                </button>
                                <button
                                  onClick={() => handleCancelScheduled(post._id)}
                                  disabled={actionPostId === post._id}
                                  className="inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 text-xs font-medium disabled:opacity-50 transition-colors"
                                  title="Cancel schedule"
                                >
                                  <FiTrash2 className="w-3.5 h-3.5" /> Cancel
                                </button>
                              </>
                            )}

                            {post.status === 'failed' && (
                              <button
                                onClick={() => handlePublishScheduledNow(post._id)}
                                disabled={actionPostId === post._id}
                                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold disabled:opacity-50 transition-colors"
                              >
                                {actionPostId === post._id ? <FiLoader className="w-3.5 h-3.5 animate-spin" /> : <FiRefreshCw className="w-3.5 h-3.5" />}
                                Retry Publish Now
                              </button>
                            )}

                            {(post.status === 'published' || post.status === 'cancelled') && (
                              <span className="text-[11px] text-gray-400 py-1">
                                {post.status === 'published' ? `Published at ${new Date(post.publishedAt || post.updatedAt).toLocaleTimeString()}` : 'Schedule Cancelled'}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ================= SCHEDULE POST MODAL ================= */}
        {scheduleModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-gray-200 dark:border-gray-700 p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/50 text-purple-600 flex items-center justify-center">
                    <FiCalendar className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">Schedule Social Post</h3>
                    <p className="text-xs text-gray-400">Pick date, time & target platforms</p>
                  </div>
                </div>
                <button
                  onClick={() => setScheduleModalOpen(false)}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FiX className="w-5 h-5" />
                </button>
              </div>

              {/* Image Preview & Title */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700">
                <img
                  src={scheduleForm.imageUrl}
                  alt="Post preview"
                  className="w-16 h-16 rounded-lg object-cover border border-gray-200 shadow-sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                    {scheduleForm.title || 'Social Post'}
                  </p>
                  <p className="text-[11px] text-gray-500 capitalize">Type: {scheduleForm.postType}</p>
                  <p className="text-[11px] text-emerald-600 font-medium">Ready to schedule</p>
                </div>
              </div>

              {/* Quick Time Presets */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Quick Time Presets:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setQuickScheduleTime(1)}
                    className="px-2.5 py-1 text-xs rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium"
                  >
                    +1 Hour
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickScheduleTime(3)}
                    className="px-2.5 py-1 text-xs rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium"
                  >
                    +3 Hours
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickScheduleTime(0, 19)}
                    className="px-2.5 py-1 text-xs rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium"
                  >
                    Today 7:00 PM
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickScheduleTime(1, 10)}
                    className="px-2.5 py-1 text-xs rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium"
                  >
                    Tomorrow 10:00 AM
                  </button>
                  <button
                    type="button"
                    onClick={() => setQuickScheduleTime(1, 19)}
                    className="px-2.5 py-1 text-xs rounded-md bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-medium"
                  >
                    Tomorrow 7:00 PM
                  </button>
                </div>
              </div>

              {/* Schedule Date & Time Picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Scheduled Date & Time (IST) <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={scheduleForm.scheduledAt}
                  min={getLocalDatetimeString(new Date())}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, scheduledAt: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              {/* Platform Selection */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Publish To:
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={scheduleForm.platforms.includes('instagram')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setScheduleForm((prev) => ({
                          ...prev,
                          platforms: checked
                            ? [...prev.platforms, 'instagram']
                            : prev.platforms.filter((p) => p !== 'instagram')
                        }));
                      }}
                      className="w-4 h-4 text-pink-600 rounded"
                    />
                    <FaInstagram className="w-4 h-4 text-pink-600" /> Instagram
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={scheduleForm.platforms.includes('facebook')}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setScheduleForm((prev) => ({
                          ...prev,
                          platforms: checked
                            ? [...prev.platforms, 'facebook']
                            : prev.platforms.filter((p) => p !== 'facebook')
                        }));
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <FaFacebook className="w-4 h-4 text-blue-600" /> Facebook
                  </label>
                </div>
              </div>

              {/* Caption Textarea */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Post Caption
                </label>
                <textarea
                  rows={3}
                  value={scheduleForm.caption}
                  onChange={(e) => setScheduleForm((prev) => ({ ...prev, caption: e.target.value }))}
                  placeholder="Enter caption with hashtags..."
                  className="w-full px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                />
              </div>

              {/* Feedback messages */}
              {scheduleFeedback && (
                <div className={`p-3 rounded-lg text-xs font-medium border ${
                  scheduleFeedback.type === 'success'
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}>
                  {scheduleFeedback.message}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setScheduleModalOpen(false)}
                  disabled={submittingSchedule}
                  className="px-4 py-2 rounded-lg text-xs font-medium border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSchedule}
                  disabled={submittingSchedule || !scheduleForm.scheduledAt || scheduleForm.platforms.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold disabled:opacity-50 shadow-sm transition-colors"
                >
                  {submittingSchedule ? (
                    <><FiLoader className="w-4 h-4 animate-spin" /> Scheduling...</>
                  ) : (
                    <><FiClock className="w-4 h-4" /> Confirm & Schedule</>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketingPage;
