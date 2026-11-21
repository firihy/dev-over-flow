"use client";

import { standardSchemaResolver } from "@hookform/resolvers/standard-schema";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";
import ROUTES from "@/constants/routes";
import { updateUser } from "@/lib/actions/user.action";
import { ProfileSchema } from "@/lib/validations";
import type { UserProfile } from "@/types";

type ProfileValues = z.infer<typeof ProfileSchema>;

const FIELDS: {
  name: keyof ProfileValues;
  label: string;
  placeholder: string;
  required?: boolean;
  type?: "text" | "url";
  autoComplete?: string;
  multiline?: boolean;
}[] = [
  {
    name: "name",
    label: "Name",
    placeholder: "Your name",
    required: true,
    autoComplete: "name",
  },
  {
    name: "username",
    label: "Username",
    placeholder: "Your username",
    required: true,
    autoComplete: "username",
  },
  {
    name: "portfolio",
    label: "Portfolio link",
    placeholder: "https://your-site.com",
    type: "url",
    autoComplete: "url",
  },
  {
    name: "location",
    label: "Location",
    placeholder: "Where do you live?",
    autoComplete: "address-level2",
  },
  {
    name: "bio",
    label: "Bio",
    placeholder: "What's special about you?",
    multiline: true,
  },
];

const inputClass =
  "paragraph-regular background-light900_dark300 light-border-2 text-dark300_light700 no-focus min-h-14 border";

// The form on /profile/edit. The user can change their name, username,
// link, location and bio; the page already checked they are signed in.
const ProfileForm = ({ user }: { user: UserProfile }) => {
  const router = useRouter();
  const form = useForm<ProfileValues>({
    resolver: standardSchemaResolver(ProfileSchema),
    defaultValues: {
      name: user.name,
      username: user.username,
      portfolio: user.portfolio ?? "",
      location: user.location ?? "",
      bio: user.bio ?? "",
    },
  });

  const handleSubmit = async (values: ProfileValues) => {
    let result: Awaited<ReturnType<typeof updateUser>>;
    try {
      result = await updateUser(values);
    } catch {
      // The action couldn't be reached (offline, server down...)
      toast.error("Something went wrong", {
        description: "Please check your connection and try again.",
      });
      return;
    }

    if (result.success) {
      toast.success("Profile updated");
      router.push(ROUTES.PROFILE_DETAILS(result.data.userId));
      return;
    }

    // Errors about one of our fields (e.g. "username already taken") go
    // under that field; anything else becomes a toast
    const { message, details = {} } = result.error;
    const fieldErrors = Object.entries(details).filter(
      ([field, messages]) =>
        FIELDS.some(({ name }) => name === field) && messages.length > 0,
    );
    for (const [field, messages] of fieldErrors) {
      form.setError(field as keyof ProfileValues, { message: messages[0] });
    }
    if (fieldErrors.length === 0) {
      toast.error("Couldn't update your profile", { description: message });
    }
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-9">
      <FieldGroup className="gap-9">
        {FIELDS.map((item) => (
          <Controller
            key={item.name}
            control={form.control}
            name={item.name}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid} className="gap-3.5">
                <FieldLabel
                  htmlFor={field.name}
                  className="paragraph-semibold text-dark400_light800"
                >
                  {item.label}
                  {item.required && (
                    <span className="text-primary-500" aria-hidden="true">
                      *
                    </span>
                  )}
                </FieldLabel>

                {item.multiline ? (
                  <Textarea
                    {...field}
                    id={field.name}
                    rows={5}
                    placeholder={item.placeholder}
                    aria-invalid={fieldState.invalid}
                    className={inputClass}
                  />
                ) : (
                  <Input
                    {...field}
                    id={field.name}
                    type={item.type ?? "text"}
                    autoComplete={item.autoComplete}
                    placeholder={item.placeholder}
                    required={item.required}
                    aria-invalid={fieldState.invalid}
                    className={inputClass}
                  />
                )}

                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        ))}

        <div className="flex justify-end gap-3">
          <Button asChild variant="outline" className="light-border-2">
            <Link href={ROUTES.PROFILE_DETAILS(user._id)}>Cancel</Link>
          </Button>
          <Button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="primary-gradient text-light-900 min-w-28"
          >
            {form.formState.isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
      </FieldGroup>
    </form>
  );
};

export default ProfileForm;
