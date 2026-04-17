import { useEffect, useState } from "react";

type UseDebounceParams = {
  value: string;
  delay?: number;
};

export function useDebounce({ value, delay = 400 }: UseDebounceParams) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
