"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { api, ApiClientError } from "@/lib/api-client";

const DEFAULT_AVATAR = "https://img.magnific.com/free-vector/blue-circle-with-white-user_78370-4707.jpg?semt=ais_test_b&w=740&q=80";

interface MeUser {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  bio?: string;
  dateOfBirth?: string;
  profilePictureUrl?: string;
  plan?: string;
  planStatus?: string;
  planStartDate?: string;
  planExpiryDate?: string;
  isVerified?: boolean;
  twoFactorEnabled?: boolean;
  profileVisibility?: string;
  notificationPreferences?: any;
  lastLoginAt?: string;
  role: string;
}

export function AccountView() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "subscription" | "preferences" | "security" | "notifications" | "advanced">("profile");
  const [user, setUser] = useState<MeUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [profileVisibility, setProfileVisibility] = useState("PRIVATE");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [language, setLanguage] = useState("en-US");
  const [timezone, setTimezone] = useState("UTC");
  const [dateFormat, setDateFormat] = useState("MM/DD/YYYY");
  const [timeFormat, setTimeFormat] = useState("12h");

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [pushNotifs, setPushNotifs] = useState(true);
  const [marketingNotifs, setMarketingNotifs] = useState(false);
  const [productUpdatesNotifs, setProductUpdatesNotifs] = useState(true);
  const [siteActivityNotifs, setSiteActivityNotifs] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<{ user: MeUser }>("/api/auth/me");
        setUser(data.user);
        setFirstName(data.user.firstName || "");
        setLastName(data.user.lastName || "");
        setUsername(data.user.username || "");
        setBio(data.user.bio || "");
        setDateOfBirth(data.user.dateOfBirth ? (data.user.dateOfBirth.split('T')[0] || "") : "");
        setProfileVisibility(data.user.profileVisibility || "PRIVATE");
        setTwoFactorEnabled(data.user.twoFactorEnabled || false);

        const prefs = data.user.notificationPreferences || {};
        setLanguage(prefs.language || "en-US");
        setTimezone(prefs.timezone || "UTC");
        setDateFormat(prefs.dateFormat || "MM/DD/YYYY");
        setTimeFormat(prefs.timeFormat || "12h");
        setJobTitle(prefs.jobTitle || "");
        setCompany(prefs.company || "");
        setLocation(prefs.location || "");

        setEmailNotifs(prefs.emailNotifs ?? true);
        setPushNotifs(prefs.pushNotifs ?? true);
        setMarketingNotifs(prefs.marketingNotifs ?? false);
        setProductUpdatesNotifs(prefs.productUpdatesNotifs ?? true);
        setSiteActivityNotifs(prefs.siteActivityNotifs ?? true);
      } catch (err) {
        if (err instanceof ApiClientError && err.status === 401) {
          router.replace("/login?next=/dashboard/account");
          return;
        }
        setError("Failed to load account");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  async function logout() {
    await api.post("/api/auth/logout");
    router.replace("/login");
  }

  async function updateProfile(e: React.FormEvent) {
    e.preventDefault();
    setUpdatingProfile(true);
    try {
      const prefs = user?.notificationPreferences || {};
      const updatedPrefs = {
        ...prefs, jobTitle, company, location, language, timezone, dateFormat, timeFormat,
        emailNotifs, pushNotifs, marketingNotifs, productUpdatesNotifs, siteActivityNotifs
      };

      const data = await api.patch<{ user: MeUser }>("/api/auth/me", {
        firstName, lastName, username, bio, dateOfBirth: dateOfBirth || undefined, profileVisibility, twoFactorEnabled,
        notificationPreferences: updatedPrefs
      });
      setUser(data.user);
      setFirstName(data.user.firstName || "");
      setLastName(data.user.lastName || "");
      setUsername(data.user.username || "");
      setBio(data.user.bio || "");
      setDateOfBirth(data.user.dateOfBirth ? (data.user.dateOfBirth.split('T')[0] || "") : "");
      setProfileVisibility(data.user.profileVisibility || "PRIVATE");
      setTwoFactorEnabled(data.user.twoFactorEnabled || false);
      window.dispatchEvent(new CustomEvent("ps-profile-updated", { detail: { user: data.user } }));
    } catch (err: any) {
      alert(err.message || "Failed to update profile");
    } finally {
      setUpdatingProfile(false);
    }
  }

  async function autoSaveNotif(key: string, val: boolean) {
    if (!user) return;

    // Update local state immediately for snappy UI
    if (key === 'emailNotifs') setEmailNotifs(val);
    if (key === 'pushNotifs') setPushNotifs(val);
    if (key === 'marketingNotifs') setMarketingNotifs(val);
    if (key === 'productUpdatesNotifs') setProductUpdatesNotifs(val);
    if (key === 'siteActivityNotifs') setSiteActivityNotifs(val);

    const prefs = user.notificationPreferences || {};
    const updatedPrefs = {
      ...prefs, jobTitle, company, location, language, timezone, dateFormat, timeFormat,
      emailNotifs, pushNotifs, marketingNotifs, productUpdatesNotifs, siteActivityNotifs,
      [key]: val
    };

    try {
      const data = await api.patch<{ user: MeUser }>("/api/auth/me", { notificationPreferences: updatedPrefs });
      setUser(data.user);
    } catch {
      alert("Failed to save preference");
    }
  }

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size exceeds 5MB limit");
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/auth/me/avatar", {
        method: "POST",
        body: formData,
        credentials: "include"
      });

      if (!response.ok) throw new Error("Failed to upload avatar");
      const data = await response.json();
      setUser(data.data.user);
      window.dispatchEvent(new CustomEvent("ps-profile-updated", { detail: { user: data.data.user } }));
    } catch (err) {
      alert("An error occurred while uploading profile picture");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAvatarRemove() {
    setUploadingAvatar(true);
    try {
      const data = await api.delete<{ user: MeUser }>("/api/auth/me/avatar");
      setUser(data.user);
      window.dispatchEvent(new CustomEvent("ps-profile-updated", { detail: { user: data.user } }));
    } catch (err) {
      alert("Failed to remove avatar");
    } finally {
      setUploadingAvatar(false);
    }
  }

  return (
    <div className="mx-auto max-w-[840px]">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl text-balance">Settings</h1>
        <p className="mt-2 text-[15px] text-muted-foreground">Manage your workspace preferences and account settings.</p>
      </div>

      {error ? <p className="mb-6 rounded-xl border border-danger/20 bg-red-50 px-4 py-3.5 text-[14px] text-danger shadow-sm dark:bg-red-950/30 dark:border-red-900/50">{error}</p> : null}

      {loading ? (
        <div className="space-y-6">
          <div className="h-40 animate-pulse rounded-2xl border border-border/60 bg-neutral-100/50  dark:bg-neutral-900/50" />
          <div className="h-64 animate-pulse rounded-2xl border border-border/60 bg-neutral-100/50  dark:bg-neutral-900/50" />
        </div>
      ) : null}

      {!loading && user ? (
        <div className="space-y-8 pb-12">
          {/* Tabs Navigation */}
          <div className="flex space-x-1.5 rounded-xl bg-neutral-100/70 p-1.5 dark:bg-neutral-800/50 w-full sm:w-auto overflow-x-auto hide-scrollbar border border-border/50  max-w-fit shadow-sm">
            {(["profile", "subscription", "preferences", "security", "notifications", "advanced"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`capitalize whitespace-nowrap rounded-lg px-4 py-2 text-[13.5px] font-semibold transition-all outline-none ${activeTab === tab
                  ? "bg-white text-foreground shadow-[0_1px_2px_rgba(0,0,0,0.06)] dark:bg-[#2C2C2E] "
                  : "text-muted-foreground hover:text-neutral-800 hover:bg-neutral-200/50  dark:hover:text-neutral-200 dark:hover:bg-neutral-800/50"
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          {/* 1. Profile Information */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">Account Information</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">Essential account details and verification.</p>
                </div>
                <div className="px-7 py-6">
                  <dl className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Email Address</dt>
                      <dd className="flex items-center gap-2.5 text-[14px] font-medium text-neutral-900 dark:text-neutral-200">
                        {user.email}
                        {user.isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[9px] uppercase tracking-wide font-bold text-blue-700 ring-1 ring-blue-200/50 dark:bg-blue-900/30 dark:text-blue-400 dark:ring-blue-800/50">
                            <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            Verified
                          </span>
                        )}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Workspace Role</dt>
                      <dd>
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold capitalize text-emerald-700 ring-1 ring-emerald-200/50 dark:bg-emerald-950/30 dark:text-emerald-400 dark:ring-emerald-900/50">
                          {user.role}
                        </span>
                      </dd>
                    </div>
                  </dl>
                </div>
              </section>

              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">Personal Details</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">Update your public presence and biographics.</p>
                </div>

                <form onSubmit={(e) => void updateProfile(e)} className="px-7 py-6 flex flex-col gap-6">

                  {/* Profile Avatar section */}
                  <div className="flex items-center gap-6">
                    <div className="relative h-[72px] w-[72px] overflow-hidden rounded-full border border-neutral-200/50 bg-neutral-50 shadow-sm dark:border-neutral-700/50 dark:bg-neutral-800 shrink-0">
                      {user.profilePictureUrl ? (
                        <img src={user.profilePictureUrl} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <img src={DEFAULT_AVATAR} alt="Default Avatar" className="h-full w-full object-cover" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <p className="text-[13px] font-medium text-foreground">Profile Picture</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="rounded-xl border border-neutral-200/80 bg-white px-4 py-2 text-[13px] font-bold text-neutral-700 shadow-sm transition-all hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-primary-500/10 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700 disabled:opacity-50"
                        >
                          {uploadingAvatar ? "Uploading..." : "Change avatar"}
                        </button>
                        {user.profilePictureUrl && (
                          <button
                            type="button"
                            onClick={() => void handleAvatarRemove()}
                            disabled={uploadingAvatar}
                            className="rounded-xl px-4 py-2 text-[13px] font-bold text-danger transition-all hover:bg-red-50 focus-visible:ring-4 focus-visible:ring-red-500/10 dark:hover:bg-red-950/40 disabled:opacity-50"
                          >
                            Remove
                          </button>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg, image/png, image/webp" onChange={(e) => void handleAvatarUpload(e)} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-2">
                    <div>
                      <label htmlFor="firstName" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">First Name</label>
                      <input
                        id="firstName"
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Enter first name"
                        required
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="lastName" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Last Name</label>
                      <input
                        id="lastName"
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Enter last name (optional)"
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="username" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Username</label>
                      <input
                        id="username"
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="unique_username"
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="dob" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Date of Birth</label>
                      <input
                        id="dob"
                        type="date"
                        value={dateOfBirth}
                        onChange={(e) => setDateOfBirth(e.target.value)}
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="bio" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Bio / About</label>
                    <textarea
                      id="bio"
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about yourself..."
                      className="block w-full resize-y min-h-[100px] rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="jobTitle" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Job Title</label>
                      <input
                        id="jobTitle"
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="e.g. Senior Designer"
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Company</label>
                      <input
                        id="company"
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        placeholder="e.g. Acme Corp"
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="location" className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Location</label>
                    <input
                      id="location"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] placeholder:text-neutral-400 focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all"
                    />
                  </div>

                  <div className="pt-6 border-t border-neutral-100 dark:border-neutral-800/80 mt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h4 className="text-[14px] font-bold text-foreground">Profile Visibility</h4>
                        <p className="mt-1 text-[13px] text-muted-foreground">Control who can view your public profile.</p>
                      </div>
                      <select
                        value={profileVisibility}
                        onChange={(e) => setProfileVisibility(e.target.value)}
                        className="block w-full sm:w-40 rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                      >
                        <option value="PUBLIC">Public</option>
                        <option value="PRIVATE">Private</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={updatingProfile}
                      className="rounded-xl bg-neutral-900 px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-all focus-visible:ring-4 focus-visible:ring-neutral-900/10"
                    >
                      {updatingProfile ? "Saving..." : "Save Profile"}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}

          {/* 2. Plan Details */}
          {activeTab === "subscription" && (
            <div className="space-y-6">
              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">Subscription & Billing</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">Manage your current plan and view payment history.</p>
                </div>

                <div className="px-7 py-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Current Plan</dt>
                      <dd className="text-[14px] font-semibold text-foreground">{user.plan || "Free Tier"}</dd>
                    </div>
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Status</dt>
                      <dd className="flex items-center gap-1.5 text-[14px] font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
                        {user.planStatus || "ACTIVE"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Start Date</dt>
                      <dd className="text-[14px] text-foreground">
                        {user.planStartDate ? new Date(user.planStartDate).toLocaleDateString() : "-"}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Renewal Date</dt>
                      <dd className="text-[14px] text-foreground">
                        {user.planExpiryDate ? new Date(user.planExpiryDate).toLocaleDateString() : "Lifetime Access"}
                      </dd>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/80 flex justify-end">
                    <button className="rounded-xl bg-primary-600 px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-primary-700 transition-all focus-visible:ring-4 focus-visible:ring-primary-600/20">
                      Upgrade Plan
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 3. Settings */}
          {activeTab === "preferences" && (
            <div className="space-y-6">

              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">Appearance</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">Customize the visual theme for your workspace.</p>
                </div>

                <div className="px-7 py-6">
                  <div className="flex gap-3">
                    {(["light", "dark", "system"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTheme(t)}
                        className={`capitalize rounded-xl border px-5 py-2.5 text-[14px] font-bold transition-all ${mounted && theme === t
                          ? "border-primary-500/20 bg-primary-50 text-primary-700 ring-1 ring-primary-500 dark:bg-primary-900/10 dark:text-primary-400 dark:border-primary-500/50"
                          : "border-neutral-200/80 bg-white text-neutral-600 hover:bg-neutral-50 dark:border-neutral-700/80 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
                          }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">Localization</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">Set your language and regional formatting preferences.</p>
                </div>

                <div className="px-7 py-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Language</label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                      >
                        <option value="en-US">English (US)</option>
                        <option value="en-GB">English (UK)</option>
                        <option value="es-ES">Spanish</option>
                        <option value="fr-FR">French</option>
                        <option value="de-DE">German</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Timezone</label>
                      <select
                        value={timezone}
                        onChange={(e) => setTimezone(e.target.value)}
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                      >
                        <option value="UTC">UTC (Coordinated Universal Time)</option>
                        <option value="America/New_York">EST / EDT (New York)</option>
                        <option value="America/Los_Angeles">PST / PDT (Los Angeles)</option>
                        <option value="Europe/London">GMT / BST (London)</option>
                        <option value="Asia/Tokyo">JST (Tokyo)</option>
                        <option value="Australia/Sydney">AEST / AEDT (Sydney)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Date Format</label>
                      <select
                        value={dateFormat}
                        onChange={(e) => setDateFormat(e.target.value)}
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                      >
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground block mb-2">Time Format</label>
                      <select
                        value={timeFormat}
                        onChange={(e) => setTimeFormat(e.target.value)}
                        className="block w-full rounded-xl border border-border/80 bg-card text-foreground px-3.5 py-2.5 text-[14px] shadow-[0_1px_2px_rgba(0,0,0,0.02)] focus:border-primary-500 focus:outline-none focus:ring-4 focus:ring-primary-500/10 transition-all cursor-pointer"
                      >
                        <option value="12h">12-hour (1:00 PM)</option>
                        <option value="24h">24-hour (13:00)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end mt-8 pt-6 border-t border-neutral-100 dark:border-neutral-800/80">
                    <button
                      type="button"
                      onClick={(e) => void updateProfile(e as any)}
                      disabled={updatingProfile}
                      className="rounded-xl bg-neutral-900 px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200 transition-all focus-visible:ring-4 focus-visible:ring-neutral-900/10"
                    >
                      {updatingProfile ? "Saving..." : "Save Preferences"}
                    </button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 4. Security */}
          {activeTab === "security" && (
            <div className="space-y-6">

              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">Account Security</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">Keep your account safe with passwords and two-factor authentication.</p>
                </div>

                <div className="px-7 py-6 space-y-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[14px] font-bold text-foreground">Two-Factor Authentication</h4>
                      <p className="mt-1 text-[13px] text-muted-foreground">Add an extra layer of security to your account.</p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        className="peer sr-only"
                        checked={twoFactorEnabled}
                        onChange={(e) => {
                          const val = e.target.checked;
                          setTwoFactorEnabled(val);
                          setUpdatingProfile(true);
                          api.patch("/api/auth/me", { twoFactorEnabled: val }).finally(() => setUpdatingProfile(false));
                        }}
                      />
                      <div className="peer h-6 w-11 rounded-full bg-neutral-200/80 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 dark:bg-neutral-800 dark:after:border-neutral-700"></div>
                    </label>
                  </div>

                  <div className="border-t border-neutral-100 dark:border-neutral-800/80 pt-6">
                    <h4 className="text-[14px] font-bold text-foreground">Password Settings</h4>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Update your password or initiate a reset.
                    </p>
                    <Link href="/login?intent=forgot" className="mt-4 inline-flex rounded-xl border border-neutral-200/80 bg-white px-5 py-2.5 text-[13px] font-bold text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-all hover:bg-neutral-50 focus-visible:ring-4 focus-visible:ring-primary-500/10 dark:border-neutral-700/80 dark:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800">
                      Change Password
                    </Link>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5 flex items-center justify-between">
                  <div>
                    <h3 className="text-[15px] font-semibold text-foreground">Session Activity</h3>
                    <p className="mt-1 text-[13px] text-muted-foreground">View and manage devices logged into your account.</p>
                  </div>
                  <span className="inline-flex rounded-lg bg-neutral-100 px-3 py-1 text-[11px] font-bold text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                    Last login: {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : "Unknown"}
                  </span>
                </div>

                <div className="px-7 py-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-[14px] font-bold text-foreground">Current Session</h4>
                      <p className="mt-1 text-[13px] text-muted-foreground">
                        Sign out immediately on this device.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" onClick={() => void logout()} className="rounded-xl border border-neutral-200/80 bg-white px-5 py-2.5 text-[13px] font-bold text-neutral-700 shadow-[0_1px_2px_rgba(0,0,0,0.02)] hover:bg-neutral-50 dark:border-neutral-700/80 dark:bg-neutral-100 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-800 transition-all focus-visible:ring-4 focus-visible:ring-neutral-900/10">
                        Log out
                      </button>
                      <button type="button" onClick={() => void logout()} className="rounded-xl border border-transparent bg-red-50/80 px-5 py-2.5 text-[13px] font-bold text-danger hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-950/50 transition-all focus-visible:ring-4 focus-visible:ring-red-500/10">
                        Log out of all devices
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* 5. Notifications */}
          {activeTab === "notifications" && (
            <div className="space-y-6">

              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">Notification Preferences</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">Manage how and when you receive critical updates and news.</p>
                </div>

                <div className="px-7 py-6 space-y-6">
                  {[
                    { id: 'emailNotifs', label: 'Email Notifications', desc: 'Receive notifications directly to your email address.', checked: emailNotifs },
                    { id: 'pushNotifs', label: 'Push Notifications', desc: 'Allow push notifications on this device.', checked: pushNotifs },
                    { id: 'marketingNotifs', label: 'Marketing Offers', desc: 'Receive promotional offers and exclusive news.', checked: marketingNotifs },
                    { id: 'productUpdatesNotifs', label: 'Product Updates', desc: 'Receive news about new features and improvements.', checked: productUpdatesNotifs },
                    { id: 'siteActivityNotifs', label: 'Site Activity', desc: 'Get notified when significant changes happen to your sites.', checked: siteActivityNotifs }
                  ].map((item, index) => (
                    <div key={item.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${index !== 0 ? 'pt-6 border-t border-neutral-100 dark:border-neutral-800/80' : ''}`}>
                      <div>
                        <h4 className="text-[14px] font-bold text-foreground">{item.label}</h4>
                        <p className="mt-1 text-[13px] text-muted-foreground">{item.desc}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input type="checkbox" className="peer sr-only" checked={item.checked} onChange={(e) => void autoSaveNotif(item.id, e.target.checked)} />
                        <div className="peer h-6 w-11 rounded-full bg-neutral-200/80 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-neutral-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-500 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-500/20 dark:bg-neutral-800 dark:after:border-neutral-700"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </section>

            </div>
          )}

          {/* 6. Advanced */}
          {activeTab === "advanced" && (
            <div className="space-y-6">

              <section className="rounded-2xl border border-border/60 bg-card shadow-sm ">
                <div className="border-b border-neutral-100 dark:border-neutral-800/80 px-7 py-5">
                  <h3 className="text-[15px] font-semibold text-foreground">Export Options</h3>
                  <p className="mt-1 text-[13px] text-muted-foreground">Download your personal and workspace context data as zip.</p>
                </div>
                <div className="px-7 py-6">
                  <button type="button" className="rounded-xl bg-neutral-900 px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-neutral-800 transition-all dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200">
                    Request Data Export
                  </button>
                </div>
              </section>

              <section className="rounded-2xl border border-red-200/50 bg-red-50/10 shadow-sm dark:border-red-900/30 dark:bg-[#1A0505]">
                <div className="border-b border-red-100/50 dark:border-red-900/30 px-7 py-5">
                  <h3 className="text-[15px] font-bold text-danger">Danger Zone</h3>
                  <p className="mt-1 text-[13px] text-red-500/80 dark:text-red-400/80">Irreversible, destructive account settings.</p>
                </div>
                <div className="px-7 py-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-[14px] font-bold text-foreground">Delete Account</h4>
                    <p className="mt-1 text-[13px] text-muted-foreground">
                      Permanently delete your account and all associated site data.
                    </p>
                  </div>
                  <button type="button" className="rounded-xl bg-danger px-6 py-2.5 text-[14px] font-bold text-white shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:bg-red-700 transition-all focus-visible:ring-4 focus-visible:ring-red-500/20">
                    Delete Account
                  </button>
                </div>
              </section>

            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
