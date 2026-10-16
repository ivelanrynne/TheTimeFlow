import Logout from "@/auth/Logout"
import { Button } from "@/components/ui/button";
import api from "@/lib/axios";
import { useAuthStore } from "@/stores/useAuthStore";
import { toast } from "sonner";


const SetTimePage = () => {
  const user = useAuthStore(s => s.user);

  const handleOnCLick = async () => {
    try {
      await api.get('/users/me', {withCredentials: true});
      toast.success("Fetching user info...");
      console.log("User info:", user);
    } catch (error) {
      toast.error("Error fetching user info");
      console.error("Error fetching user info:", error);
    }
  }
  return (
    <div>
      {user? (
        <div>

          <Button onClick={ handleOnCLick }>test</Button>

          <h1>Welcome, {user.displayName}</h1>
          <p>Email: {user.email}</p>
        </div>
      ): (
        <p>Please sign in to view this page.</p>
      )}
      <Logout />
    </div>
  )
}

export default SetTimePage