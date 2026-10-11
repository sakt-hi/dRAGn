
import axios from "axios";

export const apiClient = axios.create({
    baseURL:
        process.env.NEXT_PUBLIC_API_BASE_URL,
    timeout: 60_000,
    headers: {
        "Content-Type": "application/json",
    },
});

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (axios.isAxiosError(error)) {
            const message =
                error.response?.data?.detail ??
                error.response?.data?.error?.message ??
                error.message ??
                "An unexpected API error occurred.";

            return Promise.reject(
                new Error(
                    typeof message === "string"
                        ? message
                        : JSON.stringify(message),
                ),
            );
        }

        return Promise.reject(error);
    },
);