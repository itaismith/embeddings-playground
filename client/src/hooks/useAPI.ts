import { useEffect, useState } from "react";
import { AxiosError } from "axios";

const useAPI = <T>(
  apiFunction: () => Promise<T>,
): [T | null, boolean, string, () => void] => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await apiFunction();
      setData(result);
    } catch (e: any) {
      if (e.response && e.response.data) {
        setError(e.response.data.detail || e.message);
      } else {
        setError(e.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data) {
      return;
    }
    fetchData();
  }, []);

  return [data, loading, error, fetchData];
};

export default useAPI;
