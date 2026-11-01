import Navbar from "@/components/navigation/navbar";

const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <main>
      <Navbar />
      <section className="px-6 pt-28 sm:px-12">{children}</section>
    </main>
  );
};

export default RootLayout;
