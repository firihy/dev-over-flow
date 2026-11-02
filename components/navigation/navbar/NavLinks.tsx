"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment } from "react";

import { SheetClose } from "@/components/ui/sheet";
import { sidebarLinks } from "@/constants";
import ROUTES from "@/constants/routes";
import { cn } from "@/lib/utils";

interface NavLinksProps {
  isMobileNav?: boolean;
  userId?: string;
}

const isRouteActive = (pathname: string, route: string) =>
  route === ROUTES.HOME
    ? pathname === route
    : pathname === route || pathname.startsWith(`${route}/`);

const NavLinks = ({ isMobileNav = false, userId }: NavLinksProps) => {
  const pathname = usePathname();

  return (
    <>
      {sidebarLinks.map((item) => {
        const isProfile = item.route === ROUTES.PROFILE;
        if (isProfile && !userId) return null;

        const href = isProfile ? `${item.route}/${userId}` : item.route;
        const isActive = isRouteActive(pathname, item.route);
        const Wrapper = isMobileNav ? SheetClose : Fragment;

        return (
          <Wrapper key={item.label} {...(isMobileNav && { asChild: true })}>
            <Link
              href={href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex items-center justify-start gap-4 bg-transparent p-4",
                isActive
                  ? "primary-gradient text-light-900 rounded-lg"
                  : "text-dark300_light900",
              )}
            >
              <Image
                src={item.imgURL}
                alt=""
                width={20}
                height={20}
                className={cn(!isActive && "invert-colors")}
              />
              <p
                className={cn(
                  isActive ? "base-bold" : "base-medium",
                  !isMobileNav && "max-lg:hidden",
                )}
              >
                {item.label}
              </p>
            </Link>
          </Wrapper>
        );
      })}
    </>
  );
};

export default NavLinks;
