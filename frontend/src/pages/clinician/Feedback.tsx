import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Icon } from "@iconify/react";

export default function ClinicianFeedbackPage() {
  const { accessToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    feedback_type: "ux",
    title: "",
    message: "",
    rating: 5,
  });

  const feedbackTypes = [
    { value: "bug", label: "🐛 Bug Report" },
    { value: "feature", label: "✨ Feature Request" },
    { value: "ux", label: "🎨 UX/Usability" },
    { value: "other", label: "💬 Other" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.message.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_BASE_URL}/feedback/`,
        {
          feedback_type: formData.feedback_type,
          title: formData.title,
          message: formData.message,
          rating: formData.rating,
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );

      toast.success("Thank you! Your feedback has been submitted.");
      setFormData({
        feedback_type: "ux",
        title: "",
        message: "",
        rating: 5,
      });
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit feedback. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto space-y-4">
      <section className="rounded-3xl border border-zinc-200 bg-white p-3.5 shadow-sm md:p-4">
        <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">
          Feedback
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Share your feedback
        </h1>
        <p className="mt-2 text-sm text-zinc-600 max-w-2xl">
          Help us improve the application. Your insights from clinical use are
          invaluable to making this platform better.
        </p>
      </section>

      <Card className="border-zinc-200 bg-white">
        <CardHeader className="px-4 py-3">
          <CardTitle>Submit Feedback</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 px-4 pb-4 pt-0">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Feedback Type */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700">
                Feedback Type
              </label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {feedbackTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        feedback_type: type.value,
                      })
                    }
                    className={`rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition ${
                      formData.feedback_type === type.value
                        ? "border-blue-400 bg-blue-50 text-blue-900"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300"
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700">
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="Brief title for your feedback..."
                className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Message */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700">
                Message
              </label>
              <textarea
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                placeholder="Tell us about your experience and suggestions..."
                rows={5}
                className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-zinc-700">
                How satisfied are you with the app?
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className={`h-10 w-10 rounded-lg transition ${
                      formData.rating >= star
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-zinc-100 text-zinc-400"
                    }`}
                  >
                    <Icon icon="mdi:star" className="mx-auto text-lg" />
                  </button>
                ))}
              </div>
              <p className="text-xs text-zinc-500">
                {formData.rating === 5 && "Excellent!"}
                {formData.rating === 4 && "Very good"}
                {formData.rating === 3 && "Good"}
                {formData.rating === 2 && "Fair"}
                {formData.rating === 1 && "Needs improvement"}
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl"
            >
              {loading ? "Submitting..." : "Submit Feedback"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6 text-sm text-blue-900 space-y-2">
          <div className="flex gap-2">
            <Icon icon="mdi:lightbulb" className="mt-0.5 shrink-0 text-lg" />
            <p>
              <strong>Tip:</strong> Specific feedback helps us prioritize
              improvements. Include context like patient data features or
              workflow issues when possible.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
