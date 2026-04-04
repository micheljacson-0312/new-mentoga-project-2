import { useEffect, useMemo, useState } from "react";
import { Settings, Globe, Mail, Percent, Save, CheckCircle, CreditCard, KeyRound, Webhook, Copy, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

const STORAGE_KEY = "mentoga_platform_settings";

const defaultSettings = {
  platformName: "Mentoga",
  supportEmail: "support@mentoga.com",
  commissionRate: 15,
  minBookingDuration: 15,
  maxBookingDuration: 120,
  currency: "USD",
  allowSignups: true,
  requireEmailVerification: true,
  autoApproveConsultants: false,
};

export default function PlatformSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? { ...defaultSettings, ...JSON.parse(stored) } : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  const [saved, setSaved] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(true);
  const [stripeSaving, setStripeSaving] = useState(false);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [stripeSettings, setStripeSettings] = useState({
    is_enabled: false,
    is_test_mode: true,
    publishable_key: "",
    webhook_endpoint: "",
    webhook_last_verified_at: "",
  });

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const defaultWebhookUrl = useMemo(
    () => `${supabaseUrl}/functions/v1/stripe-webhook`,
    [supabaseUrl]
  );

  useEffect(() => {
    fetchStripeSettings();
  }, []);

  const fetchStripeSettings = async () => {
    try {
      setStripeLoading(true);
      const { data, error } = await supabase
        .from("payment_provider_settings")
        .select("*")
        .eq("provider", "stripe")
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setStripeSettings({
          is_enabled: data.is_enabled,
          is_test_mode: data.is_test_mode,
          publishable_key: data.publishable_key || "",
          webhook_endpoint: data.webhook_endpoint || defaultWebhookUrl,
          webhook_last_verified_at: data.webhook_last_verified_at || "",
        });
      } else {
        setStripeSettings((current) => ({
          ...current,
          webhook_endpoint: defaultWebhookUrl,
        }));
      }
    } catch (error) {
      console.error("Error loading Stripe settings:", error);
    } finally {
      setStripeLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveStripe = async () => {
    try {
      setStripeSaving(true);
      const payload = {
        provider: "stripe",
        is_enabled: stripeSettings.is_enabled,
        is_test_mode: stripeSettings.is_test_mode,
        publishable_key: stripeSettings.publishable_key.trim() || null,
        webhook_endpoint: stripeSettings.webhook_endpoint.trim() || defaultWebhookUrl,
      };

      const { error } = await supabase
        .from("payment_provider_settings")
        .upsert(payload, { onConflict: "provider" });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchStripeSettings();
    } catch (error) {
      console.error("Error saving Stripe settings:", error);
    } finally {
      setStripeSaving(false);
    }
  };

  const copyText = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    setCopyMessage(`${label} copied`);
    window.setTimeout(() => setCopyMessage(null), 2000);
  };

  return (
    <div>
      {saved && (
        <div className="mb-4 p-3 rounded-lg flex items-center gap-2 bg-green-50 border border-green-200 text-green-700">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm font-medium">Settings saved successfully</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Settings */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-blue-600" />
            <h3 className="font-semibold text-slate-900">General Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) =>
                  setSettings({ ...settings, platformName: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Support Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) =>
                    setSettings({ ...settings, supportEmail: e.target.value })
                  }
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Currency
              </label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings({ ...settings, currency: e.target.value })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="GBP">GBP (£)</option>
                <option value="PKR">PKR (₨)</option>
                <option value="INR">INR (₹)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Booking Settings */}
        <div className="bg-white rounded-lg border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-slate-900">Booking Settings</h3>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                <span className="flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Platform Commission (%)
                </span>
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={settings.commissionRate}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    commissionRate: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <p className="text-xs text-slate-500 mt-1">
                Commission charged on each booking
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Min Booking Duration (minutes)
              </label>
              <input
                type="number"
                min="5"
                value={settings.minBookingDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    minBookingDuration: parseInt(e.target.value) || 15,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Max Booking Duration (minutes)
              </label>
              <input
                type="number"
                min="15"
                value={settings.maxBookingDuration}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    maxBookingDuration: parseInt(e.target.value) || 120,
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
            </div>
          </div>
        </div>

        {/* Access Control */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 lg:col-span-2">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-green-600" />
            <h3 className="font-semibold text-slate-900">Access Control</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={settings.allowSignups}
                onChange={(e) =>
                  setSettings({ ...settings, allowSignups: e.target.checked })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Allow Signups
                </p>
                <p className="text-xs text-slate-500">
                  New users can register
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={settings.requireEmailVerification}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    requireEmailVerification: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Email Verification
                </p>
                <p className="text-xs text-slate-500">
                  Require email for signup
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input
                type="checkbox"
                checked={settings.autoApproveConsultants}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    autoApproveConsultants: e.target.checked,
                  })
                }
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Auto-Approve Consultants
                </p>
                <p className="text-xs text-slate-500">
                  Skip manual verification
                </p>
              </div>
            </label>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-6 lg:col-span-2 space-y-6">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-indigo-600" />
            <h3 className="font-semibold text-slate-900">Stripe Integration</h3>
          </div>

          {copyMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              {copyMessage}
            </div>
          )}

          {stripeLoading ? (
            <div className="py-6 text-sm text-slate-500">Loading Stripe settings...</div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={stripeSettings.is_enabled}
                    onChange={(e) => setStripeSettings({ ...stripeSettings, is_enabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Enable Stripe</p>
                    <p className="text-xs text-slate-500">Use Stripe for card payments</p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    checked={stripeSettings.is_test_mode}
                    onChange={(e) => setStripeSettings({ ...stripeSettings, is_test_mode: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Test Mode</p>
                    <p className="text-xs text-slate-500">Keep enabled until production launch</p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stripe Publishable Key</label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={stripeSettings.publishable_key}
                    onChange={(e) => setStripeSettings({ ...stripeSettings, publishable_key: e.target.value })}
                    placeholder="pk_test_... or pk_live_..."
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">This key is safe for frontend use and can be stored in the database.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Webhook Endpoint</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Webhook className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={stripeSettings.webhook_endpoint}
                      onChange={(e) => setStripeSettings({ ...stripeSettings, webhook_endpoint: e.target.value })}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  <button onClick={() => copyText(stripeSettings.webhook_endpoint || defaultWebhookUrl, "Webhook URL")} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 mt-1">Use this URL in Stripe Developers {`>`} Webhooks.</p>
              </div>

              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                  <p><strong>Do not store Stripe secret keys in the frontend or database.</strong></p>
                </div>
                <p>Set these as Supabase Edge Function secrets instead:</p>
                <div className="bg-white/80 rounded p-3 font-mono text-xs overflow-x-auto">
                  supabase secrets set STRIPE_SECRET_KEY=sk_test_xxx STRIPE_WEBHOOK_SECRET=whsec_xxx
                </div>
                <p>Then deploy the functions:</p>
                <div className="bg-white/80 rounded p-3 font-mono text-xs overflow-x-auto">
                  supabase functions deploy stripe-create-payment<br />
                  supabase functions deploy stripe-webhook
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <p className="font-medium text-slate-900 mb-2">Webhook Events to add in Stripe</p>
                  <ul className="space-y-1 text-slate-600">
                    <li>`payment_intent.succeeded`</li>
                    <li>`payment_intent.payment_failed`</li>
                    <li>`charge.refunded`</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                  <p className="font-medium text-slate-900 mb-2">Last webhook confirmation</p>
                  <p className="text-slate-600">
                    {stripeSettings.webhook_last_verified_at
                      ? new Date(stripeSettings.webhook_last_verified_at).toLocaleString()
                      : "No verified webhook received yet"}
                  </p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleSaveStripe}
                  disabled={stripeSaving}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {stripeSaving ? "Saving..." : "Save Stripe Settings"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-6 flex justify-end">
        <button
          onClick={handleSave}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Settings
        </button>
      </div>
    </div>
  );
}
