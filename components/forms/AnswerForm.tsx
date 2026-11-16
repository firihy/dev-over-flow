"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup } from "@/components/ui/field";
import { createAnswer } from "@/lib/actions/answer.action";
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
}

const AnswerForm = ({ questionId }: AnswerFormProps) => {
  const editorRef = useRef<MDXEditorMethods>(null);
  // Changing the key remounts the editor, which only reads `value` on mount
  const [editorKey, setEditorKey] = useState(0);

  const form = useForm<AnswerFormValues>({
    resolver: standardSchemaResolver(AnswerSchema),
    defaultValues: { content: "" },
  });

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

  const isBusy = form.formState.isSubmitting;

  return (
    <section aria-labelledby="answer-form-heading">
      <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center sm:gap-2">
        <h2
          id="answer-form-heading"
          className="paragraph-semibold text-dark400_light800"
        >
          Write your answer here
        </h2>
        {/* TODO: add the "Generate AI Answer" button once AI answers are built */}
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
              {isBusy ? (
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
