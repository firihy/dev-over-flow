import { Skeleton } from "@/components/ui/skeleton";

// Shown while /community fetches its users. It copies the page's layout
// (title, search and sort row, grid of cards) so nothing jumps when the
// real content arrives.
const Loading = () => (
  <>
    <h1 className="h1-bold text-dark100_light900">All Users</h1>

    <p role="status" className="sr-only">
      Loading users
    </p>

    <section className="mt-11 flex gap-5 max-sm:flex-col sm:items-center">
      <Skeleton className="min-h-14 grow rounded-[10px]" />
      <Skeleton className="min-h-14 rounded-[10px] sm:min-w-44" />
    </section>

    <ul className="mt-12 flex flex-wrap gap-5">
      {Array.from({ length: 10 }, (_, index) => (
        <li key={index} className="w-full xs:w-auto">
          <Skeleton className="h-60 w-full rounded-2xl xs:w-57.5" />
        </li>
      ))}
    </ul>
  </>
);

export default Loading;
