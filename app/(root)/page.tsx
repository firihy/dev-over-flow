import Link from "next/link";

import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";

const Home = () => {
  return (
    <section className="flex w-full flex-col-reverse justify-between gap-4 sm:flex-row sm:items-center">
      <h1 className="h1-bold text-dark100_light900">All Questions</h1>

      <Button
        asChild
        className="primary-gradient text-light-900 min-h-11.5 px-4 py-3"
      >
        <Link href={ROUTES.ASK_QUESTION}>Ask a Question</Link>
      </Button>
    </section>
  );
};

export default Home;
