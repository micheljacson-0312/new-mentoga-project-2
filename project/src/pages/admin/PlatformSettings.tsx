import { useState } from "react";
import { Settings, Globe, Mail, Percent, Save, CheckCircle } from "lucide-react";

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

  const handleSave = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
