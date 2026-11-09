"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Controller,
  type DefaultValues,
  type FieldValues,
  type Path,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
import { toast } from "sonner";
import type { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import ROUTES from "@/constants/routes";
import type { ActionResponse } from "@/types";

interface AuthFormProps<T extends FieldValues> {
  schema: z.ZodType<T, T>;
  defaultValues: T;
  // A server action, e.g. signUpWithCredentials
  onSubmit: (data: T) => Promise<ActionResponse>;
  formType: "SIGN_IN" | "SIGN_UP";
}

const AuthForm = <T extends FieldValues>({
  schema,
  defaultValues,
  formType,
  onSubmit,
}: AuthFormProps<T>) => {
  const router = useRouter();
  const form = useForm<T>({
    resolver: standardSchemaResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });

  const isSignIn = formType === "SIGN_IN";

  const handleSubmit: SubmitHandler<T> = async (data) => {
    let result: ActionResponse;
    try {
      result = await onSubmit(data);
    } catch {
      // The action couldn't be reached (offline, server down...)
      toast.error("Something went wrong", {
        description: "Please check your connection and try again.",
      });
      return;
    }

    if (result.success) {
      toast.success(
        isSignIn ? "Signed in successfully" : "Signed up successfully",
      );
      // The action set the session cookie, so the next page renders
      // signed in
      router.push(ROUTES.HOME);
      return;
    }

    // Errors about one of our fields (e.g. "username already taken") go
    // under that field; anything else becomes a toast
    const { message, details = {} } = result.error;
    const fieldErrors = Object.entries(details).filter(
      ([field, messages]) => field in defaultValues && messages.length > 0,
    );
    for (const [field, messages] of fieldErrors) {
      form.setError(field as Path<T>, { message: messages[0] });
    }
    if (fieldErrors.length === 0) {
      toast.error(isSignIn ? "Sign-in failed" : "Sign-up failed", {
        description: message,
      });
    }
  };
  const buttonText = isSignIn ? "Sign In" : "Sign Up";
  const pendingText = isSignIn ? "Signing In..." : "Signing Up...";

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-10">
      <FieldGroup className="gap-6">
        {Object.keys(defaultValues).map((name) => (
          <Controller
            key={name}
            control={form.control}
            name={name as Path<T>}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-2.5">
                <FieldLabel
                  htmlFor={field.name}
                  className="paragraph-medium text-dark400_light700"
                >
                  {field.name === "email"
                    ? "Email Address"
                    : field.name.charAt(0).toUpperCase() + field.name.slice(1)}
                </FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  type={
                    field.name === "password" || field.name === "email"
                      ? field.name
                      : "text"
                  }
                  autoComplete={
                    field.name === "password"
                      ? isSignIn
                        ? "current-password"
                        : "new-password"
                      : field.name
                  }
                  aria-invalid={fieldState.invalid}
                  className="paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 no-focus rounded-1.5 min-h-12 border"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}

        <Button
          type="submit"
          disabled={form.formState.isSubmitting}
          className="primary-gradient paragraph-medium rounded-2 font-inter text-light-900! min-h-12 w-full px-4 py-3"
        >
          {form.formState.isSubmitting ? pendingText : buttonText}
        </Button>

        {isSignIn ? (
          <p>
            Don&apos;t have an account?{" "}
            <Link
              href={ROUTES.SIGN_UP}
              className="paragraph-semibold primary-text-gradient"
            >
              Sign up
            </Link>
          </p>
        ) : (
          <p>
            Already have an account?{" "}
            <Link
              href={ROUTES.SIGN_IN}
              className="paragraph-semibold primary-text-gradient"
            >
              Sign in
            </Link>
          </p>
        )}
      </FieldGroup>
    </form>
  );
};

export default AuthForm;
