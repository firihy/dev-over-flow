import { LogOut } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ROUTES from "@/constants/routes";
import { signOutUser } from "@/lib/actions/auth.action";

import NavLinks from "./NavLinks";

const MobileNavigation = async () => {
  const session = await auth();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon-lg" className="sm:hidden">
          <Image
            src="/icons/hamburger.svg"
            width={36}
            height={36}
            alt=""
            className="invert-colors"
          />
          <span className="sr-only">Open navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="background-light900_dark200 border-none"
      >
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <Link href={ROUTES.HOME} className="flex items-center gap-1 px-4 pt-6">
          <Image
            src="/images/site-logo.svg"
            width={23}
            height={23}
            alt="DevFlow Logo"
          />
          <p className="h2-bold font-space-grotesk text-dark-100 dark:text-light-900">
            Dev <span className="text-primary-500">Flow</span>
          </p>
        </Link>

        <div className="no-scrollbar flex h-[calc(100vh-80px)] flex-col justify-between overflow-y-auto">
          <nav className="flex h-full flex-col gap-6 pt-16">
            <NavLinks isMobileNav userId={session?.user?.id} />
          </nav>

          {session ? (
            <form action={signOutUser} className="px-4 pb-6">
              {/* SheetClose on the button: the click closes the menu and
                  submits the form */}
              <SheetClose asChild>
                <Button
                  type="submit"
                  className="small-medium light-border-2 btn-tertiary text-dark400_light900 min-h-10.25 w-full rounded-lg border px-4 py-3 shadow-none"
                >
                  <LogOut aria-hidden />
                  Log Out
                </Button>
              </SheetClose>
            </form>
          ) : (
            <div className="flex flex-col gap-3 px-4 pb-6">
              <SheetClose asChild>
                <Button
                  asChild
                  className="small-medium btn-secondary min-h-10.25 w-full rounded-lg px-4 py-3 shadow-none"
                >
                  <Link href={ROUTES.SIGN_IN}>
                    <span className="primary-text-gradient">Log In</span>
                  </Link>
                </Button>
              </SheetClose>

              <SheetClose asChild>
                <Button
                  asChild
                  className="small-medium light-border-2 btn-tertiary text-dark400_light900 min-h-10.25 w-full rounded-lg border px-4 py-3 shadow-none"
                >
                  <Link href={ROUTES.SIGN_UP}>Sign Up</Link>
                </Button>
              </SheetClose>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MobileNavigation;
