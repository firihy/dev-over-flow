import { Skeleton } from "@/components/ui/skeleton";

// Shown while /jobs waits for the job listings, which can take a few seconds
const Loading = () => (
  <>
    <h1 className="h1-bold text-dark100_light900">Jobs</h1>

    <p role="status" className="sr-only">
      Loading jobs
    </p>

    <section className="mt-11 flex gap-5 max-sm:flex-col sm:items-center">
      <Skeleton className="min-h-14 grow rounded-[10px]" />
      <Skeleton className="min-h-14 rounded-[10px] sm:w-52.5" />
    </section>

    <ul className="mt-12 flex flex-col gap-6">
      {Array.from({ length: 5 }, (_, index) => (
        <li key={index}>
          <Skeleton className="h-52 w-full rounded-lg sm:h-44" />
        </li>
      ))}
    </ul>
  </>
);

export default Loading;
