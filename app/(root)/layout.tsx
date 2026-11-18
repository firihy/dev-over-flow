import { Suspense } from "react";

import LeftSidebar from "@/components/navigation/LeftSidebar";
import Navbar from "@/components/navigation/navbar";
import RightSidebar, {
  RightSidebarFallback,
} from "@/components/navigation/RightSidebar";

const HomeLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <main className="background-light850_dark100 relative">
      <Navbar />
      <div className="flex">
        <LeftSidebar />

        <section className="flex min-h-screen flex-1 flex-col px-6 pt-36 pb-6 max-md:pb-14 sm:px-14">
          <div className="mx-auto w-full max-w-5xl">{children}</div>
        </section>

        {/* Its lists come from the database: stream them in so the page
            doesn't wait for them */}
        <Suspense fallback={<RightSidebarFallback />}>
          <RightSidebar />
        </Suspense>
      </div>
    </main>
  );
};

export default HomeLayout;
