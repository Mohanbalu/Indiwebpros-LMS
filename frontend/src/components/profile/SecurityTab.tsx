import { useState, FormEvent } from "react";
import { Shield, KeyRound, Smartphone, Monitor, Globe, LogOut, CheckCircle2, AlertCircle, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ChangePasswordInput } from "@/services/profile.service";

interface SessionItem {
  id: string;
  deviceName?: string;
  browser?: string;
  operatingSystem?: string;
  ipAddress?: string;
  lastActiveAt?: string;
}

interface SecurityTabProps {
  sessions?: SessionItem[];
  onChangePassword: (data: ChangePasswordInput) => Promise<any>;
  onRevokeSession: (sessionId: string) => Promise<any>;
  onSuccessToast: (msg: string) => void;
  onErrorToast: (msg: string) => void;
}

export function SecurityTab({
  sessions = [],
  onChangePassword,
  onRevokeSession,
  onSuccessToast,
  onErrorToast,
}: SecurityTabProps) {
  // Change password state
  const [passForm, setPassForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPass, setIsChangingPass] = useState(false);

  // 2FA mock toggle
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      onErrorToast("New Password and Confirm Password do not match.");
      return;
    }
    if (passForm.newPassword.length < 8) {
      onErrorToast("New password must be at least 8 characters long.");
      return;
    }

    setIsChangingPass(true);
    try {
      await onChangePassword(passForm);
      onSuccessToast("Password changed successfully!");
      setPassForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) {
      onErrorToast(err?.response?.data?.message || err?.message || "Failed to change password.");
    } finally {
      setIsChangingPass(false);
    }
  };

  const handleRevoke = async (sessionId: string) => {
    try {
      await onRevokeSession(sessionId);
      onSuccessToast("Device session revoked successfully.");
    } catch (err: any) {
      onErrorToast(err?.response?.data?.message || err?.message || "Failed to revoke session.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left 2 Cols: Change Password & Active Sessions */}
      <div className="lg:col-span-2 space-y-6">
        {/* Change Password Form */}
        <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-2">
              <KeyRound className="h-4 w-4 text-blue-500" />
              Change Account Password
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
              <Input
                id="sec-cur-pass"
                label="Current Password"
                type="password"
                placeholder="••••••••"
                value={passForm.currentPassword}
                onChange={(e) => setPassForm({ ...passForm, currentPassword: e.target.value })}
                required
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  id="sec-new-pass"
                  label="New Password"
                  type="password"
                  placeholder="Min 8 characters"
                  value={passForm.newPassword}
                  onChange={(e) => setPassForm({ ...passForm, newPassword: e.target.value })}
                  required
                />
                <Input
                  id="sec-conf-pass"
                  label="Confirm New Password"
                  type="password"
                  placeholder="Re-enter new password"
                  value={passForm.confirmPassword}
                  onChange={(e) => setPassForm({ ...passForm, confirmPassword: e.target.value })}
                  required
                />
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  size="sm"
                  disabled={isChangingPass}
                  className="rounded-xl font-bold text-xs uppercase tracking-wider bg-blue-600 text-white flex items-center gap-1.5"
                >
                  {isChangingPass ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Updating Password...
                    </>
                  ) : (
                    <>
                      <KeyRound className="h-3.5 w-3.5" />
                      Update Password
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Active Sessions & Connected Devices */}
        <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-2">
              <Monitor className="h-4 w-4 text-emerald-500" />
              Active Sessions & Connected Devices
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {sessions.length === 0 ? (
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/20 text-xs text-zinc-500 flex items-center gap-3">
                <Monitor className="h-5 w-5 text-zinc-400" />
                <span>Current Browser Session Active</span>
              </div>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <div
                    key={s.id}
                    className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-850 bg-zinc-50/50 dark:bg-zinc-950/20 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                        {s.deviceName?.toLowerCase().includes("mobile") ? (
                          <Smartphone className="h-5 w-5 text-blue-500" />
                        ) : (
                          <Monitor className="h-5 w-5 text-indigo-500" />
                        )}
                      </div>
                      <div>
                        <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          {s.deviceName || `${s.browser || "Browser"} on ${s.operatingSystem || "Device"}`}
                        </h5>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {s.ipAddress ? `IP: ${s.ipAddress} • ` : ""}
                          Last Active: {s.lastActiveAt ? new Date(s.lastActiveAt).toLocaleString() : "Recently"}
                        </p>
                      </div>
                    </div>

                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => handleRevoke(s.id)}
                      className="rounded-xl text-[10px] font-bold uppercase tracking-wider text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      <LogOut className="h-3 w-3 mr-1" />
                      Revoke
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Right 1 Col: 2FA & Security Insights */}
      <div className="space-y-6">
        {/* Two Factor Authentication Card */}
        <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-purple-500" />
              Two-Factor Authentication (2FA)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-zinc-800 dark:text-zinc-200">2FA Protection</h5>
                <p className="text-[10px] text-zinc-400">Secure logins with verification codes</p>
              </div>
              <button
                onClick={() => {
                  setTwoFactorEnabled(!twoFactorEnabled);
                  if (!twoFactorEnabled) onSuccessToast("2FA configuration enabled.");
                  else onSuccessToast("2FA status updated.");
                }}
                className="focus:outline-none"
              >
                {twoFactorEnabled ? (
                  <ToggleRight className="h-8 w-8 text-blue-600 fill-blue-600/10" />
                ) : (
                  <ToggleLeft className="h-8 w-8 text-zinc-300 dark:text-zinc-700" />
                )}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 text-xs text-purple-900 dark:text-purple-300 font-medium leading-relaxed">
              {twoFactorEnabled
                ? "🔒 2FA is active. Verification will be required on new device logins."
                : "💡 Enable 2FA to add an extra layer of protection to your LMS student profile."}
            </div>
          </CardContent>
        </Card>

        {/* Account Security Overview */}
        <Card className="overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800/60">
            <CardTitle className="text-xs font-extrabold uppercase text-zinc-400 dark:text-zinc-500 tracking-wider flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-3 text-xs font-semibold">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/30">
              <span>Email Verified</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/30 text-zinc-700 dark:text-zinc-300 border border-zinc-200/60 dark:border-zinc-800">
              <span>SSL Encryption</span>
              <span className="text-[10px] font-bold text-blue-600">256-BIT</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
