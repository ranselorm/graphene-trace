import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useComments, useCreateComment } from "@/hooks/useComments";
import type { CommentResponse } from "@/hooks/useComments";
import {
  useTelemetrySessionFrames,
  useTelemetrySessions,
} from "@/hooks/useTelemetry";
import { toast } from "sonner";

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
  return (
    <div style={{ marginLeft: depth * 20 }}>
      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-4 my-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-zinc-700">
          <div>
            <span className="font-medium text-zinc-900">
              {comment.user_name}
            </span>
            <span className="ml-2 text-xs uppercase tracking-[0.2em] text-zinc-500">
              {comment.user_role}
            </span>
          </div>
          <div className="text-xs text-zinc-500">
            {new Date(comment.created_at).toLocaleString()}
          </div>
        </div>
        <p className="mt-3 whitespace-pre-line text-sm text-zinc-800">
          {comment.body}
        </p>
        <div className="mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setReplyingTo(replyingTo === comment.id ? null : comment.id)
            }
          >
            Reply
          </Button>
        </div>
        {replyingTo === comment.id && (
          <div className="mt-3 space-y-2">
            <textarea
              value={replyBody}
              onChange={(event) => setReplyBody(event.target.value)}
              rows={3}
              placeholder="Write a reply..."
              className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none"
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

export default function PatientCommentsPage() {
  const { data: sessions = [] } = useTelemetrySessions();
  const [selectedSessionId, setSelectedSessionId] = useState<number | null>(
    null,
  );
  const [selectedFrameNumber, setSelectedFrameNumber] = useState(0);
  const [commentBody, setCommentBody] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [replyBody, setReplyBody] = useState("");

  useEffect(() => {
    if (!selectedSessionId && sessions.length > 0) {
      setSelectedSessionId(sessions[0].id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  useEffect(() => {
    setSelectedFrameNumber(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSessionId]);

  const selectedSession =
    sessions.find((session) => session.id === selectedSessionId) ?? null;

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
    ? `Session ${selectedSession.session_date.slice(0, 10)} (#${selectedSession.id})`
    : "";

  const handleSubmit = async (parent?: number) => {
    const body = parent ? replyBody.trim() : commentBody.trim();
    if (!selectedSensorFrameId) {
      toast.error("Pick a session and frame before leaving a comment.");
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
        ...(parent && { parent }),
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

  const handleReply = (parentId: number) => handleSubmit(parentId);

  return (
    <div className="container mx-auto space-y-6">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">
              Comments
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900">
              Review sensor frame notes
            </h1>
            <p className="mt-2 text-sm text-zinc-600 max-w-2xl">
              Select a session and frame to view existing commentary and add
              your own patient notes.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.25fr_0.9fr]">
        <Card className="border-zinc-200 bg-white">
          <CardHeader>
            <CardTitle>Frame selection</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm text-zinc-700">
                Session
                <select
                  value={selectedSessionId ?? ""}
                  onChange={(event) =>
                    setSelectedSessionId(Number(event.target.value) || null)
                  }
                  className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
                >
                  {sessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {`${new Date(session.session_date).toLocaleDateString()} • ${session.filename}`}
                    </option>
                  ))}
                </select>
              </label>

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
            </div>

            <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
              <p>
                {selectedSession
                  ? `${selectedSessionLabel} / Frame ${selectedFrameNumber + 1}`
                  : "Choose a session to load comments."}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                This app stores comments for individual sensor frames so your
                clinician can see exactly where the note belongs.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-200 bg-white">
          <CardHeader>
            <CardTitle>Leave a comment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <textarea
              value={commentBody}
              onChange={(event) => setCommentBody(event.target.value)}
              rows={6}
              placeholder="Write a note about this frame..."
              className="w-full resize-none rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-blue-500 focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs text-zinc-500">
                {selectedSensorFrameId
                  ? "Your comment will be attached to the selected frame."
                  : "Pick a session and frame first."}
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
        <CardHeader>
          <CardTitle>Frame comments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingFrame || loadingComments ? (
            <div className="text-sm text-zinc-600">Loading comments...</div>
          ) : !selectedSensorFrameId ? (
            <div className="text-sm text-zinc-600">
              Select a session and frame to see comments.
            </div>
          ) : comments.length === 0 ? (
            <div className="text-sm text-zinc-600">
              No comments yet for this frame. Leave the first note above.
            </div>
          ) : (
            <div className="space-y-4">
              {comments
                .filter((c) => c.parent === null)
                .map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    depth={0}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyBody={replyBody}
                    setReplyBody={setReplyBody}
                    onReply={handleReply}
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
