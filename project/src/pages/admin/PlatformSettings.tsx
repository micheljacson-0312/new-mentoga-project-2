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
  const [providersLoading, setProvidersLoading] = useState(true);
  const [providerSaving, setProviderSaving] = useState<string | null>(null);
  const [copyMessage, setCopyMessage] = useState<string | null>(null);
  const [paymentProviders, setPaymentProviders] = useState<Array<{
    provider: string;
    display_name: string;
    is_enabled: boolean;
    is_test_mode: boolean;
    publishable_key: string;
    public_key_label: string;
    webhook_endpoint: string;
    webhook_last_verified_at: string;
    integration_notes: string;
    metadata: Record<string, any> | null;
  }>>([]);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookUrlForProvider = useMemo(
    () => (provider: string) => `${supabaseUrl}/functions/v1/${provider}-webhook`,
    [supabaseUrl]
  );

  useEffect(() => {
    fetchPaymentProviders();
  }, []);

  const fetchPaymentProviders = async () => {
    try {
      setProvidersLoading(true);
      const { data, error } = await supabase
        .from("payment_provider_settings")
        .select("*")
        .order("provider", { ascending: true });

      if (error) throw error;
      setPaymentProviders(
        (data || []).map((item) => ({
          provider: item.provider,
          display_name: item.display_name || item.provider,
          is_enabled: item.is_enabled,
          is_test_mode: item.is_test_mode,
          publishable_key: item.publishable_key || "",
          public_key_label: item.public_key_label || "Public Key",
          webhook_endpoint: item.webhook_endpoint || webhookUrlForProvider(item.provider),
          webhook_last_verified_at: item.webhook_last_verified_at || "",
          integration_notes: item.integration_notes || "",
          metadata: item.metadata as Record<string, any> | null,
        }))
      );
    } catch (error) {
      console.error("Error loading payment provider settings:", error);
    } finally {
      setProvidersLoading(false);
    }
  };

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const updateProviderField = (provider: string, field: string, value: any) => {
    setPaymentProviders((current) =>
      current.map((item) => (item.provider === provider ? { ...item, [field]: value } : item))
    );
  };

  const handleSaveProvider = async (provider: string) => {
    try {
      const current = paymentProviders.find((item) => item.provider === provider);
      if (!current) return;

      setProviderSaving(provider);
      const payload = {
        provider: current.provider,
        display_name: current.display_name,
        is_enabled: current.is_enabled,
        is_test_mode: current.is_test_mode,
        publishable_key: current.publishable_key.trim() || null,
        public_key_label: current.public_key_label,
        webhook_endpoint: current.webhook_endpoint.trim() || webhookUrlForProvider(current.provider),
        integration_notes: current.integration_notes,
        metadata: current.metadata || {},
      };

      const { error } = await supabase
        .from("payment_provider_settings")
        .upsert(payload, { onConflict: "provider" });

      if (error) throw error;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      await fetchPaymentProviders();
    } catch (error) {
      console.error(`Error saving ${provider} settings:`, error);
    } finally {
      setProviderSaving(null);
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
            <h3 className="font-semibold text-slate-900">Payment Gateway Integrations</h3>
          </div>

          {copyMessage && (
            <div className="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm font-medium">
              {copyMessage}
            </div>
          )}

          {providersLoading ? (
            <div className="py-6 text-sm text-slate-500">Loading payment gateway settings...</div>
          ) : (
            <div className="space-y-6">
              {paymentProviders.map((provider) => {
                const secretNames = provider.metadata?.secretNames || [];

                return (
                  <div key={provider.provider} className="rounded-xl border border-slate-200 p-5 space-y-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h4 className="text-lg font-semibold text-slate-900">{provider.display_name}</h4>
                        <p className="text-sm text-slate-500">{provider.integration_notes}</p>
                      </div>
                      <div className="text-xs font-bold uppercase tracking-widest text-slate-400">{provider.provider}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={provider.is_enabled}
                          onChange={(e) => updateProviderField(provider.provider, "is_enabled", e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Enable {provider.display_name}</p>
                          <p className="text-xs text-slate-500">Allow users to pay using {provider.display_name}</p>
                        </div>
                      </label>

                      <label className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
                        <input
                          type="checkbox"
                          checked={provider.is_test_mode}
                          onChange={(e) => updateProviderField(provider.provider, "is_test_mode", e.target.checked)}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div>
                          <p className="text-sm font-medium text-slate-900">Test Mode</p>
                          <p className="text-xs text-slate-500">Keep enabled until this provider is ready for production</p>
                        </div>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{provider.public_key_label}</label>
                      <div className="relative">
                        <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={provider.publishable_key}
                          onChange={(e) => updateProviderField(provider.provider, "publishable_key", e.target.value)}
                          placeholder={`${provider.display_name} public identifier`}
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Only store non-secret identifiers here. Secrets stay in Supabase function secrets.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Webhook Endpoint</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Webhook className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            value={provider.webhook_endpoint}
                            onChange={(e) => updateProviderField(provider.provider, "webhook_endpoint", e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                          />
                        </div>
                        <button onClick={() => copyText(provider.webhook_endpoint || webhookUrlForProvider(provider.provider), `${provider.display_name} webhook URL`)} className="px-3 py-2 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                          <Copy className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                        <p><strong>Do not store {provider.display_name} secret credentials in the frontend or database.</strong></p>
                      </div>
                      {secretNames.length > 0 && (
                        <div className="bg-white/80 rounded p-3 font-mono text-xs overflow-x-auto">
                          supabase secrets set {secretNames.map((name: string) => `${name}=your_secret_here`).join(" ")}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                        <p className="font-medium text-slate-900 mb-2">Deploy commands</p>
                        <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
                          supabase functions deploy {provider.provider}-create-payment<br />
                          supabase functions deploy {provider.provider}-webhook
                        </div>
                      </div>
                      <div className="rounded-lg border border-slate-200 p-4 bg-slate-50">
                        <p className="font-medium text-slate-900 mb-2">Last webhook confirmation</p>
                        <p className="text-slate-600">
                          {provider.webhook_last_verified_at
                            ? new Date(provider.webhook_last_verified_at).toLocaleString()
                            : "No verified webhook received yet"}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => handleSaveProvider(provider.provider)}
                        disabled={providerSaving === provider.provider}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        {providerSaving === provider.provider ? "Saving..." : `Save ${provider.display_name}`}
                      </button>
                    </div>
                  </div>
                );
              })}
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
