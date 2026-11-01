import Navbar from "@/components/navigation/navbar";

const HomeLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <main>
      <Navbar />
      <section className="px-6 pt-28 sm:px-12">{children}</section>
    </main>
  );
};

export default HomeLayout;
