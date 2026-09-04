"use client";

import { useEffect, useState } from "react";
import { store } from "@/lib/store";

export function useStoreData<T>(selector: (data: ReturnType<typeof store.get>) => T): T {
  const [value, setValue] = useState<T>(() => selector(store.get()));
  useEffect(() => {
    let active = true;
    const update = () => {
      if (!active) return;
      setValue(selector(store.get()));
    };
    update();
    const unsub = store.subscribe(update);
    return () => {
      active = false;
      unsub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
}
