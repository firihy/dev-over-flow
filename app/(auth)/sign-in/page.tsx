"use client";

import AuthForm from "@/components/forms/AuthForm";
import { SignInSchema } from "@/lib/validations";

const SignIn = () => {
  return (
    <AuthForm
      formType="SIGN_IN"
      schema={SignInSchema}
      defaultValues={{ email: "", password: "" }}
      // TODO: email/password sign-in (next commit)
      onSubmit={async () => ({ success: true, data: null })}
    />
  );
};

export default SignIn;
