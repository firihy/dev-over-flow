import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import ProfileForm from "@/components/forms/ProfileForm";
import ROUTES from "@/constants/routes";
import { getUser } from "@/lib/actions/user.action";

export const metadata: Metadata = {
  title: "Edit Profile",
  robots: { index: false },
};

const EditProfile = async () => {
  const userId = (await auth())?.user?.id;
  if (!userId) redirect(ROUTES.SIGN_IN);

  const result = await getUser({ userId });
  if (!result.success) {
    // A session for a user that no longer exists signs in again; anything
    // else (e.g. the database is down) goes to the error page
    if (result.status === 404) redirect(ROUTES.SIGN_IN);
    throw new Error(result.error.message);
  }

  return (
    <>
      <h1 className="h1-bold text-dark100_light900">Edit Profile</h1>

      <ProfileForm user={result.data.user} />
    </>
  );
};

export default EditProfile;
