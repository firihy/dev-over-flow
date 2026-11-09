"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import { Loader2Icon } from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { type KeyboardEvent, useRef, useState, useTransition } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import TagCard from "@/components/cards/TagCard";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import ROUTES from "@/constants/routes";
import { createQuestion } from "@/lib/actions/question.action";
import { AskQuestionSchema } from "@/lib/validations";

// The editor touches `window`, so it can only render in the browser
const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => (
    <div className="background-light800_dark200 light-border-2 min-h-87.5 w-full border" />
  ),
});

type QuestionFormValues = z.infer<typeof AskQuestionSchema>;

// Reuse the schema's rules (max 3 tags, max length, no duplicates) so they
// live in one place
const TagsSchema = AskQuestionSchema.shape.tags;

const INPUT_CLASSES =
  "paragraph-regular background-light700_dark300 light-border-2 text-dark300_light700 no-focus min-h-14 border";

const RequiredMark = () => (
  <span className="text-primary-500" aria-hidden>
    *
  </span>
);

// The fields a server error can point at
const FIELD_NAMES = ["title", "content", "tags"] as const;
const isFieldName = (name: string): name is (typeof FIELD_NAMES)[number] =>
  (FIELD_NAMES as readonly string[]).includes(name);

const QuestionForm = () => {
  const router = useRouter();
  const editorRef = useRef<MDXEditorMethods>(null);
  // True while the question's page loads after a successful submit
  const [isNavigating, startNavigation] = useTransition();

  const form = useForm<QuestionFormValues>({
    resolver: standardSchemaResolver(AskQuestionSchema),
    defaultValues: { title: "", content: "", tags: [] },
  });

  const [tagInput, setTagInput] = useState("");

  const addTag = (tags: string[], onChange: (tags: string[]) => void) => {
    const tag = tagInput.trim();
    if (!tag) return;

    const nextTags = [...tags, tag];
    const result = TagsSchema.safeParse(nextTags);
    if (!result.success) {
      form.setError("tags", { message: result.error.issues[0].message });
      return;
    }

    onChange(nextTags);
    setTagInput("");
    form.clearErrors("tags");
  };

  const handleTagKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    tags: string[],
    onChange: (tags: string[]) => void,
  ) => {
    // Ignore Enter while an IME (e.g. Japanese input) is still composing
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return;

    // Enter would otherwise submit the whole form
    e.preventDefault();
    addTag(tags, onChange);
  };

  const handleCreateQuestion: SubmitHandler<QuestionFormValues> = async (
    data,
  ) => {
    let result;
    try {
      result = await createQuestion(data);
    } catch {
      // The action couldn't be reached (offline, server down...)
      toast.error("Something went wrong", {
        description: "Please check your connection and try again.",
      });
      return;
    }

    if (result.success) {
      toast.success("Question posted");
      // In a transition, so the button stays disabled until the new page
      // shows. Otherwise a second click could post the question twice.
      startNavigation(() => router.push(ROUTES.QUESTION(result.data._id)));
      return;
    }

    // Errors about one of our fields go under that field; anything else
    // (e.g. 401 when the session expired) becomes a toast
    const { message, details = {} } = result.error;
    let shownOnField = false;
    for (const [field, messages] of Object.entries(details)) {
      if (!isFieldName(field) || !messages[0]) continue;
      form.setError(field, { message: messages[0] });
      shownOnField = true;
    }
    if (!shownOnField) {
      toast.error("Couldn't post your question", { description: message });
    }
  };

  const isBusy = form.formState.isSubmitting || isNavigating;

  return (
    <form onSubmit={form.handleSubmit(handleCreateQuestion)}>
      <FieldGroup className="gap-10">
        <Controller
          control={form.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-3">
              <FieldLabel
                htmlFor="title"
                className="paragraph-semibold text-dark400_light800"
              >
                Question Title <RequiredMark />
              </FieldLabel>
              <Input
                {...field}
                id="title"
                aria-invalid={fieldState.invalid}
                aria-describedby="title-description"
                className={INPUT_CLASSES}
              />
              <FieldDescription
                id="title-description"
                className="body-regular text-light-500"
              >
                Be specific and imagine you&apos;re asking a question to another
                person.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="content"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-3">
              <FieldLabel className="paragraph-semibold text-dark400_light800">
                Detailed explanation of your problem <RequiredMark />
              </FieldLabel>
              <Editor
                value={field.value}
                onChange={field.onChange}
                editorRef={editorRef}
              />
              <FieldDescription className="body-regular text-light-500">
                Introduce the problem and expand on what you&apos;ve put in the
                title.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="tags"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="gap-3">
              <FieldLabel
                htmlFor="tags"
                className="paragraph-semibold text-dark400_light800"
              >
                Tags <RequiredMark />
              </FieldLabel>
              <Input
                id="tags"
                // Lets the form focus this input when tags are invalid
                ref={field.ref}
                onBlur={field.onBlur}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) =>
                  handleTagKeyDown(e, field.value, field.onChange)
                }
                placeholder="Add tags..."
                aria-invalid={fieldState.invalid}
                className={INPUT_CLASSES}
              />
              {field.value.length > 0 && (
                <div className="flex-start flex-wrap gap-2.5">
                  {field.value.map((tag) => (
                    <TagCard
                      key={tag}
                      _id={tag}
                      name={tag}
                      onRemove={() => {
                        // Drop stale errors like "max 3 tags"; after a submit,
                        // onChange re-checks the schema and re-adds real ones
                        form.clearErrors("tags");
                        field.onChange(field.value.filter((t) => t !== tag));
                      }}
                    />
                  ))}
                </div>
              )}
              <FieldDescription className="body-regular text-light-500">
                Add up to 3 tags to describe what your question is about. You
                need to press enter to add a tag.
              </FieldDescription>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="mt-6 flex justify-end">
          <Button
            type="submit"
            disabled={isBusy}
            className="primary-gradient text-light-900! min-h-12 w-fit px-4 py-3"
          >
            {isBusy ? (
              <>
                <Loader2Icon className="size-4 animate-spin" aria-hidden />
                Submitting...
              </>
            ) : (
              "Ask a Question"
            )}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};

export default QuestionForm;
