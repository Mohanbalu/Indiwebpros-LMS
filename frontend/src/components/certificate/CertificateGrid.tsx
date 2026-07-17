import { memo, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";
import { EmptyState } from "@/components/ui/EmptyState";
import { CertificateCard } from "./CertificateCard";
import type { CertificateListItem, CertificateStatus, CertificateSortOption } from "@/types/certificate.types";

interface CertificateGridProps {
  certificates: CertificateListItem[];
  isLoading: boolean;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
}

export const CertificateGrid = memo(function CertificateGrid({
  certificates,
  isLoading,
  onView,
  onDownload,
}: CertificateGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<CertificateSortOption>("latest");
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "all">("all");

  const filtered = useMemo(() => {
    let result = [...certificates];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.course.title.toLowerCase().includes(q) ||
          c.certificateNumber.toLowerCase().includes(q)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((c) => c.status === statusFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.issuedAt).getTime();
      const dateB = new Date(b.issuedAt).getTime();
      return sortBy === "latest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [certificates, searchQuery, sortBy, statusFilter]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-3">
          <Spinner size="lg" />
          <p className="text-xs font-bold text-zinc-500">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (certificates.length === 0) {
    return <EmptyState title="No certificates yet" description="Complete a course to earn your first certificate." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by course or certificate number..."
            className="w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-4 py-2.5 text-sm font-medium text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:placeholder:text-zinc-500"
            aria-label="Search certificates"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as CertificateSortOption)}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            aria-label="Sort certificates"
          >
            <option value="latest">Latest</option>
            <option value="oldest">Oldest</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CertificateStatus | "all")}
            className="rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300"
            aria-label="Filter by status"
          >
            <option value="all">All Status</option>
            <option value="GENERATED">Active</option>
            <option value="REGENERATED">Regenerated</option>
            <option value="REVOKED">Revoked</option>
            <option value="EXPIRED">Expired</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm font-bold text-zinc-500">No certificates match your search.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((cert) => (
            <CertificateCard
              key={cert.id}
              certificate={cert}
              onView={onView}
              onDownload={onDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
});
