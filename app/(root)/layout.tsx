import Navbar from "@/components/navigation/navbar";

const RootLayout = ({ children }: LayoutProps<"/">) => {
  return (
    <main>
      <Navbar />
      {children}
    </main>
  );
};

export default RootLayout;
