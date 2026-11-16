"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { Loader2Icon, SparklesIcon } from "lucide-react";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import {
  Controller,
  type SubmitHandler,
  useForm,
  useWatch,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { createAnswer } from "@/lib/actions/answer.action";
import { apiClient } from "@/lib/api-client";
import { AnswerSchema } from "@/lib/validations";

// The editor touches `window`, so it can only render in the browser
const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => (
    <div className="background-light800_dark200 light-border-2 min-h-87.5 w-full border" />
  ),
});

type AnswerFormValues = z.infer<typeof AnswerSchema>;

interface AnswerFormProps {
  questionId: string;
  // Sent to the AI so it knows what to answer
  questionTitle: string;
  questionContent: string;
}

const AnswerForm = ({
  questionId,
  questionTitle,
  questionContent,
}: AnswerFormProps) => {
  const editorRef = useRef<MDXEditorMethods>(null);
  // Changing the key remounts the editor, which only reads `value` on mount
  const [editorKey, setEditorKey] = useState(0);

  const form = useForm<AnswerFormValues>({
    resolver: standardSchemaResolver(AnswerSchema),
    defaultValues: { content: "" },
  });

  const [isGenerating, setIsGenerating] = useState(false);
  // Cancels a running AI request when the user leaves the page
  const aiRequest = useRef<AbortController | null>(null);
  useEffect(() => () => aiRequest.current?.abort(), []);

  // With a draft, the AI improves it instead of writing from scratch
  const content = useWatch({ control: form.control, name: "content" });
  const hasDraft = content.trim() !== "";

  // Puts new text in the form and remounts the editor to show it
  const setContent = (content: string) => {
    form.setValue("content", content, { shouldDirty: true });
    form.clearErrors("content");
    setEditorKey((key) => key + 1);
  };

  const generateAIAnswer = async () => {
    const draft = form.getValues("content");
    const controller = new AbortController();
    aiRequest.current = controller;
    setIsGenerating(true);

    try {
      const result = await apiClient.ai.getAnswer(
        {
          question: questionTitle,
          content: questionContent,
          userAnswer: draft,
        },
        { signal: controller.signal },
      );

      if (!result.success) {
        toast.error("Couldn't generate an answer", {
          description:
            result.status === 401
              ? "Your session has expired. Please sign in again."
              : result.error.message,
        });
        return;
      }

      setContent(result.data);
      toast.success(
        draft.trim() ? "Answer improved with AI" : "AI answer added",
        {
          description: "Review it before posting.",
          // Brings back the exact draft the AI started from
          action: draft.trim()
            ? { label: "Undo", onClick: () => setContent(draft) }
            : undefined,
          duration: 10_000,
        },
      );
    } catch (error) {
      // An abort means the user left the page: nothing to show
      if (error instanceof Error && error.name === "AbortError") return;
      toast.error("Couldn't generate an answer", {
        description: "Something went wrong. Please try again.",
      });
    } finally {
      if (aiRequest.current === controller) aiRequest.current = null;
      setIsGenerating(false);
    }
  };

  const handleSubmit: SubmitHandler<AnswerFormValues> = async ({ content }) => {
    let result;
    try {
      result = await createAnswer({ questionId, content });
    } catch {
      // The action couldn't be reached (offline, server down...)
      toast.error("Something went wrong", {
        description: "Please check your connection and try again.",
      });
      return;
    }

    if (result.success) {
      form.reset();
      setEditorKey((key) => key + 1);
      toast.success("Answer posted");
      return;
    }

    // A content error goes under the editor; anything else (e.g. 401 when
    // the session expired, 404 when the question was deleted) is a toast
    const contentError = result.error.details?.content?.[0];
    if (contentError) {
      form.setError("content", { message: contentError });
    } else {
      toast.error("Couldn't post your answer", {
        description: result.error.message,
      });
    }
  };

  const isPosting = form.formState.isSubmitting;
  // One thing at a time: don't post while the AI rewrites the editor
  const isBusy = isPosting || isGenerating;

  return (
    <section aria-labelledby="answer-form-heading">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
        <h2
          id="answer-form-heading"
          className="paragraph-semibold text-dark400_light800"
        >
          Write your answer here
        </h2>
        <Button
          type="button"
          onClick={generateAIAnswer}
          disabled={isBusy}
          className="btn light-border-2 text-primary-500! w-fit gap-1.5 rounded-md border px-4 py-2.5 shadow-none"
        >
          {isGenerating ? (
            <>
              <Loader2Icon className="size-4 animate-spin" aria-hidden />
              {hasDraft ? "Improving..." : "Generating..."}
            </>
          ) : (
            <>
              <SparklesIcon className="size-4" aria-hidden />
              {hasDraft ? "Improve with AI" : "Generate AI Answer"}
            </>
          )}
        </Button>
      </div>

      <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-6 w-full">
        <FieldGroup className="gap-10">
          <Controller
            control={form.control}
            name="content"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-3">
                <Editor
                  key={editorKey}
                  value={field.value}
                  onChange={field.onChange}
                  editorRef={editorRef}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isBusy}
              className="primary-gradient text-light-900! min-h-12 w-fit px-4 py-3"
            >
              {isPosting ? (
                <>
                  <Loader2Icon className="size-4 animate-spin" aria-hidden />
                  Posting...
                </>
              ) : (
                "Post Answer"
              )}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </section>
  );
};

export default AnswerForm;
