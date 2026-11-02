"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import type { MDXEditorMethods } from "@mdxeditor/editor";
import dynamic from "next/dynamic";
import { type KeyboardEvent, useRef, useState } from "react";
import { Controller, type SubmitHandler, useForm } from "react-hook-form";
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
import { AskQuestionSchema } from "@/lib/validations";

// The editor touches `window`, so it can only render in the browser
const Editor = dynamic(() => import("@/components/editor"), {
  ssr: false,
  loading: () => (
    <div className="background-light800_dark200 light-border-2 min-h-87.5 w-full border" />
  ),
});

type QuestionFormValues = z.infer<typeof AskQuestionSchema>;

// Reuse the schema's rules (max 3 tags, max length) so they live in one place
const TagsSchema = AskQuestionSchema.shape.tags;

const INPUT_CLASSES =
  "paragraph-regular background-light700_dark300 light-border-2 text-dark300_light700 no-focus min-h-14 border";

const RequiredMark = () => (
  <span className="text-primary-500" aria-hidden>
    *
  </span>
);

const QuestionForm = () => {
  // Lets us reset the editor once questions can be submitted
  const editorRef = useRef<MDXEditorMethods>(null);

  const form = useForm<QuestionFormValues>({
    resolver: standardSchemaResolver(AskQuestionSchema),
    defaultValues: { title: "", content: "", tags: [] },
  });

  const [tagInput, setTagInput] = useState("");

  const addTag = (tags: string[], onChange: (tags: string[]) => void) => {
    const tag = tagInput.trim();
    if (!tag) return;

    const isDuplicate = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
    if (isDuplicate) {
      form.setError("tags", { message: "Tag already added." });
      return;
    }

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

  const handleCreateQuestion: SubmitHandler<QuestionFormValues> = async () => {
    // TODO: Save the question
  };

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
            disabled={form.formState.isSubmitting}
            className="primary-gradient text-light-900! min-h-12 w-fit px-4 py-3"
          >
            Ask a Question
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};

export default QuestionForm;
