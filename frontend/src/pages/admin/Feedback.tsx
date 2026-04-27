import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/authContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

interface Feedback {
  id: number;
  user_name: string;
  user_email: string;
  user_role: string;
  feedback_type: string;
  title: string;
  message: string;
  rating: number;
  status: string;
  created_at: string;
}

export default function AdminFeedbackPage() {
  const { accessToken } = useAuth();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({
    total: 0,
    by_type: {} as Record<string, number>,
    by_status: {} as Record<string, number>,
    average_rating: 0,
  });

  const feedbackTypes = [
    { value: "bug", label: "Bug Report" },
    { value: "feature", label: "Feature Request" },
    { value: "ux", label: "UX/Usability" },
    { value: "other", label: "Other" },
  ];

  const statusOptions = [
    { value: "new", label: "New", color: "bg-blue-100 text-blue-900" },
    {
      value: "reviewed",
      label: "Reviewed",
      color: "bg-purple-100 text-purple-900",
    },
    {
      value: "in_progress",
      label: "In Progress",
      color: "bg-yellow-100 text-yellow-900",
    },
    {
      value: "resolved",
      label: "Resolved",
      color: "bg-green-100 text-green-900",
    },
  ];

  useEffect(() => {
    fetchFeedbacks();
    fetchStats();
  }, [typeFilter, statusFilter]);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.append("type", typeFilter);
      if (statusFilter) params.append("status", statusFilter);

      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/feedback/all/?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      setFeedbacks(response.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/feedback/stats/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      setStats(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_BASE_URL}/feedback/${id}/`,
        { status: newStatus },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      toast.success("Feedback status updated");
      fetchFeedbacks();
      fetchStats();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return "text-green-600";
    if (rating === 3) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto space-y-4">
      <section className="rounded-3xl border border-zinc-200 bg-white p-3.5 md:p-4">
        <h1 className="text-2xl font-semibold text-zinc-900">
          Feedback Management
        </h1>
        <p className="mt-2 text-sm text-zinc-600 max-w-2xl">
          Review and manage user feedback on the application. Track patterns and
          prioritize improvements.
        </p>
      </section>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-zinc-200 bg-white">
          <CardContent className="pt-6">
            <div className="text-3xl font-semibold text-zinc-900">
              {stats.total}
            </div>
            <p className="text-xs text-zinc-500 uppercase tracking-[0.12em] mt-1">
              Total Feedback
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="text-3xl font-semibold text-blue-900">
              {(stats.by_status || {}).new || 0}
            </div>
            <p className="text-xs text-blue-700 uppercase tracking-[0.12em] mt-1">
              New
            </p>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="pt-6">
            <div className="text-3xl font-semibold text-purple-900">
              {stats.average_rating}
            </div>
            <p className="text-xs text-purple-700 uppercase tracking-[0.12em] mt-1">
              Avg Rating
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="text-3xl font-semibold text-green-900">
              {(stats.by_status || {}).resolved || 0}
            </div>
            <p className="text-xs text-green-700 uppercase tracking-[0.12em] mt-1">
              Resolved
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-zinc-200 bg-white">
        <CardHeader className="px-4 py-3">
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4 pt-0">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2 text-sm text-zinc-700">
              <label className="text-sm font-medium">Type</label>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="">All Types</option>
                {feedbackTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2 text-sm text-zinc-700">
              <label className="text-sm font-medium">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              >
                <option value="">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Feedbacks List */}
      <div className="space-y-2.5">
        {loading ? (
          <Card className="border-zinc-200 bg-white">
            <CardContent className="pt-6 text-sm text-zinc-600">
              Loading feedback...
            </CardContent>
          </Card>
        ) : feedbacks.length === 0 ? (
          <Card className="border-zinc-200 bg-white">
            <CardContent className="pt-6 text-sm text-zinc-600">
              No feedback found. Try adjusting filters.
            </CardContent>
          </Card>
        ) : (
          feedbacks.map((feedback) => (
            <Card key={feedback.id} className="border-zinc-200 bg-white">
              <CardContent className="space-y-3 px-4 py-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-zinc-900">
                        {feedback.title}
                      </h3>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      from <strong>{feedback.user_name}</strong> (
                      {feedback.user_role})
                    </p>
                  </div>
                  <div
                    className={`text-lg font-semibold ${getRatingColor(feedback.rating)}`}
                  >
                    ⭐ {feedback.rating}
                  </div>
                </div>

                {/* Message */}
                <p className="line-clamp-2 text-sm text-zinc-700">
                  {feedback.message}
                </p>

                {/* Info */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                  <span>{new Date(feedback.created_at).toLocaleString()}</span>
                  <span>•</span>
                  <span className="inline-block rounded-full bg-zinc-100 px-2 py-1 text-zinc-600">
                    {feedbackTypes.find(
                      (t) => t.value === feedback.feedback_type,
                    )?.label || feedback.feedback_type}
                  </span>
                </div>

                {/* Status Buttons */}
                <div className="flex flex-wrap gap-2 pt-1">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateStatus(feedback.id, option.value)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                        feedback.status === option.value
                          ? `${option.color} ring-2 ring-offset-1`
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
