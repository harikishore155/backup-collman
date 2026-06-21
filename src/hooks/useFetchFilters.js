import { useEffect, useState } from "react";
import axiosInstance from "@/utils/axiosInstance";
import { extractListPayload, isApiFailure } from "@/utils/apiHelpers";
import toast from "react-hot-toast";

const useFetchFilters = (filterEndpoint) => {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!filterEndpoint) return;

        const fetchOptions = async () => {
            setLoading(true);

            try {
                const response = await axiosInstance.get(filterEndpoint);
                const data = response.data;

                if (isApiFailure(data)) {
                    toast.error(
                        data?.message ||
                            data?.error ||
                            "Failed to load filter options",
                    );
                    setOptions([]);
                    return;
                }

                const { rows } = extractListPayload(data);
                setOptions(rows);
            } catch (error) {
                console.error("Error fetching filter options:", error);
                toast.error(
                    error.response?.data?.message ||
                        "Something went wrong while loading data. Please try again later.",
                );
                setOptions([]);
            } finally {
                setLoading(false);
            }
        };

        fetchOptions();
    }, [filterEndpoint]);

    return { options, loading };
};

export default useFetchFilters;
