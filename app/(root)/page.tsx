import { signOut } from "@/auth";
import { Button } from "@/components/ui/button";
import ROUTES from "@/constants/routes";

const Home = () => {
  return (
    <>
      <h1 className="h1-bold">Welcome to the world of Next.js!</h1>

      <form
        className="mt-10"
        action={async () => {
          "use server";
          await signOut({ redirectTo: ROUTES.SIGN_IN });
        }}
      >
        <Button type="submit">Log out</Button>
      </form>
    </>
  );
};

export default Home;
