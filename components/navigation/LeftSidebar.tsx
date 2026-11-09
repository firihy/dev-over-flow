import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";
import { signOutUser } from "@/lib/actions/auth.action";

import NavLinks from "./navbar/NavLinks";

const LeftSidebar = async () => {
  const session = await auth();

  return (
    <section className="custom-scrollbar background-light900_dark200 light-border shadow-light-300 sticky top-0 left-0 flex h-screen shrink-0 flex-col justify-between overflow-y-auto border-r p-6 pt-36 max-sm:hidden lg:w-66.5 dark:shadow-none">
      <nav className="flex flex-1 flex-col gap-6">
        <NavLinks userId={session?.user?.id} />
      </nav>

      {session ? (
        <form action={signOutUser}>
          <Button
            type="submit"
            className="small-medium light-border-2 btn-tertiary text-dark400_light900 min-h-10.25 w-full rounded-lg border px-4 py-3 shadow-none"
          >
            <LogOut className="lg:hidden" aria-hidden />
            <span className="max-lg:sr-only">Log Out</span>
          </Button>
        </form>
      ) : (
        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="small-medium btn-secondary min-h-10.25 w-full rounded-lg px-4 py-3 shadow-none"
          >
            <Link href={ROUTES.SIGN_IN}>
              <Image
                src="/icons/account.svg"
                alt=""
                width={20}
                height={20}
                className="invert-colors size-5 object-contain lg:hidden"
              />
              <span className="primary-text-gradient max-lg:sr-only">
                Log In
              </span>
            </Link>
          </Button>

          <Button
            asChild
            className="small-medium light-border-2 btn-tertiary text-dark400_light900 min-h-10.25 w-full rounded-lg border px-4 py-3 shadow-none"
          >
            <Link href={ROUTES.SIGN_UP}>
              <Image
                src="/icons/sign-up.svg"
                alt=""
                width={20}
                height={20}
                className="invert-colors size-5 object-contain lg:hidden"
              />
              <span className="max-lg:sr-only">Sign Up</span>
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
};

export default LeftSidebar;
