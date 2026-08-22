import toast from "react-hot-toast";

export const showSuccess = (message: string) => toast.success(message);

export const showError = (err: unknown, fallback = "Something went wrong. Please try again.") => {
    const error = err as { response?: { data?: { message?: string } } };
    toast.error(error?.response?.data?.message || fallback);
};