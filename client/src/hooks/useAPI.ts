import { useEffect, useState } from "react";

const useAPI = <T>(
  apiFunction: () => Promise<T>,
): [T | null, boolean, string] => {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (data) {
      return;
    }
    setLoading(true);
    apiFunction()
      .then((result) => setData(result))
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return [data, loading, error];
};

export default useAPI;
