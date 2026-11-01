"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import {
  Controller,
  type DefaultValues,
  type FieldValues,
  type Path,
  type SubmitHandler,
  useForm,
} from "react-hook-form";
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

interface AuthFormProps<T extends FieldValues> {
  schema: z.ZodType<T, T>;
  defaultValues: T;
  onSubmit: (data: T) => Promise<{ success: boolean }>;
  formType: "SIGN_IN" | "SIGN_UP";
}

const AuthForm = <T extends FieldValues>({
  schema,
  defaultValues,
  formType,
  onSubmit,
}: AuthFormProps<T>) => {
  const form = useForm<T>({
    resolver: standardSchemaResolver(schema),
    defaultValues: defaultValues as DefaultValues<T>,
  });

  const handleSubmit: SubmitHandler<T> = async (data) => {
    // TODO: Authenticate User
    await onSubmit(data);
  };

  const isSignIn = formType === "SIGN_IN";
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
                  type={field.name === "password" ? "password" : "text"}
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
