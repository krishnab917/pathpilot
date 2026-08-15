import { toast } from "sonner";

export const notify = {
  success(message: string) {
    return toast.success(message);
  },
  error(message: string) {
    return toast.error(message);
  },
};
