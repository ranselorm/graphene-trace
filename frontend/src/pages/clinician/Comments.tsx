import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

import { useAuth } from "@/context/authContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComments, useCreateComment } from "@/hooks/useComments";
import type { CommentResponse } from "@/hooks/useComments";
import {
  useTelemetrySessionFrames,
  useTelemetrySessions,
} from "@/hooks/useTelemetry";

type AssignedPatient = {
  id: number;
  full_name: string;
  email: string;
  risk_category: string;
};

type ClinicianDetails = {
  assigned_patients: AssignedPatient[];
};

interface CommentItemProps {
  comment: CommentResponse;
  depth: number;
  replyingTo: number | null;
  setReplyingTo: (id: number | null) => void;
  replyBody: string;
  setReplyBody: (body: string) => void;
  onReply: (parentId: number) => void;
  isPending: boolean;
}

function CommentItem({
  comment,
  depth,
  replyingTo,
  setReplyingTo,
  replyBody,
  setReplyBody,
  onReply,
  isPending,
}: CommentItemProps) {
  const indent = Math.min(depth * 14, 56);

  return (
    <div className="my-1.5" style={{ marginLeft: indent }}>
      <div className="w-full rounded-xl border border-zinc-200/80 bg-zinc-50/80 p-2.5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm md:p-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-700">
          <div>
            <span className="font-semibold text-zinc-900">
              {comment.user_name}
            </span>
            <span className="ml-2 text-[10px] uppercase tracking-[0.12em] text-zinc-500">
              {comment.user_role}
            </span>
          </div>
          <div className="text-[11px] text-zinc-500">
            {new Date(comment.created_at).toLocaleString()}
          </div>
        </div>
        <p className="mt-1.5 whitespace-pre-line text-[13px] leading-5 text-zinc-800">
          {comment.body}
        </p>
        <div className="mt-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setReplyingTo(replyingTo === comment.id ? null : comment.id)
            }
            className="h-6 rounded-full px-2 text-[11px] text-zinc-600 hover:bg-zinc-200/60"
          >
            Reply
          </Button>
        </div>

        {replyingTo === comment.id && (
          <div className="mt-2 space-y-2">
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={2}
              placeholder="Write a reply..."
              className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => onReply(comment.id)}
                disabled={!replyBody.trim() || isPending}
              >
                {isPending ? "Posting..." : "Post reply"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyBody("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>

      {comment.replies.map((reply) => (
        <CommentItem
          key={reply.id}
          comment={reply}
          depth={depth + 1}
          replyingTo={replyingTo}
          setReplyingTo={setReplyingTo}
          replyBody={replyBody}
          setReplyBody={setReplyBody}
          onReply={onReply}
          isPending={isPending}
        />
      ))}
    </div>
  );
}

export default function ClinicianCommentsPage() {
  const { accessToken, session } = useAuth();
  const clinicianId = session?.user?.id as number | undefined;

  const [selectedPatientId, setSelectedPatientId] = useState<number | null>(
    null,
  );
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [selectedFrameNumber, setSelectedFrameNumber] = useState(0);
  const [commentBody, setCommentBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  const { data: clinicianDetails } = useQuery<ClinicianDetails>({
    queryKey: ["clinician", "details", clinicianId],
    enabled: !!accessToken && !!clinicianId,
    queryFn: async () => {
      const { data } = await axios.get(
        `${import.meta.env.VITE_BASE_URL}/clinicians/${clinicianId}/`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        },
      );
      return data;
    },
  });

  const assignedPatients = clinicianDetails?.assigned_patients ?? [];
  const selectedPatient =
    assignedPatients.find((p) => p.id === selectedPatientId) ?? null;

  useEffect(() => {
    if (!selectedPatientId && assignedPatients.length > 0) {
      setSelectedPatientId(assignedPatients[0].id);
    }
  }, [assignedPatients, selectedPatientId]);

  const { data: sessions = [] } = useTelemetrySessions(selectedPatientId);

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
  }, [sessions, selectedSessionId]);

  useEffect(() => {
    setSelectedFrameNumber(0);
  }, [selectedSessionId]);

  const selectedSession =
    sessions.find((sessionItem) => sessionItem.id === selectedSessionId) ??
    null;

  const { data: frameData, isLoading: loadingFrame } =
    useTelemetrySessionFrames(
      selectedSessionId,
      selectedFrameNumber,
      selectedFrameNumber,
    );

  const selectedFrame = frameData?.frames?.[0] ?? null;
  const selectedSensorFrameId = selectedFrame?.id ?? null;

  const { data: comments = [], isLoading: loadingComments } = useComments(
    selectedSensorFrameId,
  );
  const createCommentMutation = useCreateComment();

  const selectedSessionLabel = selectedSession
    ? `${new Date(selectedSession.session_date).toLocaleDateString()} (#${selectedSession.id})`
    : "";

  const topLevelComments = useMemo(
    () => comments.filter((comment) => comment.parent === null),
    [comments],
  );

  const handleSubmit = (parent?: number) => {
    const body = parent ? replyBody.trim() : commentBody.trim();

    if (!selectedSensorFrameId) {
      toast.error(
        "Pick a patient, session, and frame before leaving a comment.",
      );
      return;
    }
    if (!body) {
      toast.error("Please add a comment before submitting.");
      return;
    }

    createCommentMutation.mutate(
      {
        sensor_frame: selectedSensorFrameId,
        body,
        ...(parent ? { parent } : {}),
      },
      {
        onSuccess: () => {
          if (parent) {
            setReplyBody("");
            setReplyingTo(null);
          } else {
            setCommentBody("");
          }
          toast.success("Comment posted.");
        },
        onError: () => {
          toast.error("Unable to post comment. Please try again.");
        },
      },
    );
  };

  return (
    <div className="container mx-auto space-y-4">
      <section className="rounded-3xl border border-zinc-200 bg-white p-3.5 shadow-sm md:p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
          Comments
        </p>
        <h1 className="text-2xl font-semibold text-zinc-900">
          Patient frame discussions
        </h1>
        <p className="mt-2 text-sm text-zinc-600 max-w-2xl">
          Pick one of your assigned patients, select a frame, and reply to
          patient comments.
        </p>
      </section>

      <div className="grid gap-3 xl:grid-cols-[1.25fr_0.9fr]">
        <Card className="border-zinc-200 bg-white">
          <CardHeader className="px-4 py-3">
            <CardTitle>Frame selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 pt-0">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-zinc-700">
                Patient
                <select
                  value={selectedPatientId ?? ""}
                  onChange={(event) => {
                    setSelectedPatientId(Number(event.target.value) || null);
                    setSelectedSessionId(null);
                    setSelectedFrameNumber(0);
                  }}
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  {assignedPatients.map((patient) => (
                    <option key={patient.id} value={patient.id}>
                      {patient.full_name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="flex flex-col gap-2 text-sm text-zinc-700">
                Session
                <select
                  value={selectedSessionId ?? ""}
                  onChange={(event) =>
                    setSelectedSessionId(Number(event.target.value) || null)
                  }
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  {sessions.map((sessionItem) => (
                    <option key={sessionItem.id} value={sessionItem.id}>
                      {`${new Date(sessionItem.session_date).toLocaleDateString()} • ${sessionItem.filename}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm text-zinc-700">
              Frame
              <input
                type="range"
                min={0}
                max={
                  selectedSession?.total_frames
                    ? selectedSession.total_frames - 1
                    : 0
                }
                value={selectedFrameNumber}
                onChange={(event) =>
                  setSelectedFrameNumber(Number(event.target.value))
                }
                className="h-2 w-full appearance-none rounded-full bg-zinc-200"
                disabled={!selectedSession}
              />
              <div className="text-sm text-zinc-600">
                {selectedSession
                  ? `Frame ${selectedFrameNumber + 1}/${selectedSession.total_frames}`
                  : "No sessions available."}
              </div>
            </label>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
              <p>
                {selectedPatient && selectedSession
                  ? `${selectedPatient.full_name} • ${selectedSessionLabel} • Frame ${selectedFrameNumber + 1}`
                  : "Choose patient and session to load comments."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white">
          <CardHeader className="px-4 py-3">
            <CardTitle>Add clinician comment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 px-4 pb-4 pt-0">
            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              rows={3}
              placeholder="Write a note for this frame..."
              className="w-full resize-none rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                {selectedSensorFrameId
                  ? "Your comment will be attached to the selected frame."
                  : "Pick a patient, session, and frame first."}
              </div>
              <Button
                onClick={() => handleSubmit()}
                disabled={
                  !selectedSensorFrameId ||
                  !commentBody.trim() ||
                  createCommentMutation.isPending
                }
              >
                {createCommentMutation.isPending
                  ? "Posting..."
                  : "Post comment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-zinc-200 bg-white">
        <CardHeader className="px-4 py-3">
          <CardTitle>Frame comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2.5 px-4 pb-4 pt-0 lg:px-6">
          {loadingFrame || loadingComments ? (
            <div className="text-sm text-zinc-600">Loading comments...</div>
          ) : !selectedSensorFrameId ? (
            <div className="text-sm text-zinc-600">
              Select a patient, session, and frame to see comments.
            </div>
          ) : topLevelComments.length === 0 ? (
            <div className="text-sm text-zinc-600">
              No comments yet for this frame. Leave the first note above.
            </div>
          ) : (
            <div className="space-y-3">
              {topLevelComments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  depth={0}
                  replyingTo={replyingTo}
                  setReplyingTo={setReplyingTo}
                  replyBody={replyBody}
                  setReplyBody={setReplyBody}
                  onReply={(parentId) => handleSubmit(parentId)}
                  isPending={createCommentMutation.isPending}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
