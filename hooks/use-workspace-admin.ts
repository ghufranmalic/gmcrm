"use client";

import { useEffect, useState } from "react";
import type { ManagedWorkspace } from "@/components/parent/workspace-manager";

const storageKey = "dvibe-workspaces-v1";

type StoredBusiness = ManagedWorkspace & {
  records?: unknown;
  notifications?: unknown;
};

type AppData = {
  businesses: StoredBusiness[];
  currentBusinessId: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function toManagedWorkspace(business: StoredBusiness): ManagedWorkspace {
  return {
    accent: business.accent,
    businessName: business.businessName,
    domain: business.domain || slugify(business.businessName),
    hosting: business.hosting,
    hrModules: business.hrModules,
    id: business.id,
    industryKey: business.industryKey,
    packageName: business.packageName,
    status: business.status ?? "Active"
  };
}

function loadLocalData(): AppData {
  if (typeof window === "undefined") {
    return { businesses: [], currentBusinessId: "" };
  }

  try {
    const stored = window.localStorage.getItem(storageKey);
    if (!stored) return { businesses: [], currentBusinessId: "" };

    const parsed = JSON.parse(stored) as AppData;
    if (!Array.isArray(parsed.businesses)) {
      return { businesses: [], currentBusinessId: "" };
    }

    return {
      businesses: parsed.businesses,
      currentBusinessId: parsed.currentBusinessId ?? parsed.businesses[0]?.id ?? ""
    };
  } catch {
    return { businesses: [], currentBusinessId: "" };
  }
}

function saveLocalData(data: AppData) {
  window.localStorage.setItem(storageKey, JSON.stringify(data));
}

export function useWorkspaceAdmin() {
  const [businesses, setBusinesses] = useState<ManagedWorkspace[]>([]);
  const [localBusinesses, setLocalBusinesses] = useState<StoredBusiness[]>([]);
  const [databaseEnabled, setDatabaseEnabled] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function load() {
      const localData = loadLocalData();
      if (mounted) {
        setLocalBusinesses(localData.businesses);
        setBusinesses(localData.businesses.map(toManagedWorkspace));
      }

      try {
        const response = await fetch("/api/businesses", { cache: "no-store" });
        const result = (await response.json()) as {
          businesses?: StoredBusiness[];
          databaseConfigured?: boolean;
        };

        if (!mounted || !result.databaseConfigured) return;

        setDatabaseEnabled(true);
        const next = (result.businesses ?? []).map(toManagedWorkspace);
        setBusinesses(next);
        setLocalBusinesses(result.businesses ?? []);
      } catch {
        if (mounted) setDatabaseEnabled(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (databaseEnabled || !localBusinesses.length) return;
    saveLocalData({
      businesses: localBusinesses,
      currentBusinessId: localBusinesses[0]?.id ?? ""
    });
  }, [databaseEnabled, localBusinesses]);

  async function updateBusiness(id: string, patch: Partial<ManagedWorkspace>) {
    const current = localBusinesses.find((business) => business.id === id);
    if (!current) return;

    const next: StoredBusiness = {
      ...current,
      ...patch,
      status: (patch.status as ManagedWorkspace["status"]) ?? current.status
    };

    if (databaseEnabled) {
      setIsSyncing(true);
      try {
        const response = await fetch(`/api/businesses/${id}`, {
          body: JSON.stringify(next),
          headers: { "Content-Type": "application/json" },
          method: "PATCH"
        });
        if (!response.ok) throw new Error("Failed to update workspace");
        const result = (await response.json()) as { business: StoredBusiness };
        const updated = toManagedWorkspace(result.business);
        setLocalBusinesses((items) => items.map((item) => (item.id === id ? result.business : item)));
        setBusinesses((items) => items.map((item) => (item.id === id ? updated : item)));
        return;
      } finally {
        setIsSyncing(false);
      }
    }

    setLocalBusinesses((items) => items.map((item) => (item.id === id ? next : item)));
    setBusinesses((items) => items.map((item) => (item.id === id ? toManagedWorkspace(next) : item)));
  }

  async function deleteBusiness(id: string) {
    if (databaseEnabled) {
      setIsSyncing(true);
      try {
        const response = await fetch(`/api/businesses/${id}`, { method: "DELETE" });
        if (!response.ok) throw new Error("Failed to delete workspace");
      } finally {
        setIsSyncing(false);
      }
    }

    setLocalBusinesses((items) => items.filter((item) => item.id !== id));
    setBusinesses((items) => items.filter((item) => item.id !== id));
  }

  function openPortal(businessId: string) {
    const business = businesses.find((item) => item.id === businessId);
    if (!business) return;

    if (business.status === "Inactive") {
      window.alert("This workspace is inactive. Activate it from the admin panel to allow logins.");
      return;
    }

    const url = databaseEnabled
      ? `/portal/${business.domain || slugify(business.businessName)}/login`
      : `/?open=${businessId}`;

    window.open(url, "_blank", "noopener,noreferrer");
  }

  return {
    businesses,
    databaseEnabled,
    deleteBusiness,
    isSyncing,
    openPortal,
    updateBusiness
  };
}
