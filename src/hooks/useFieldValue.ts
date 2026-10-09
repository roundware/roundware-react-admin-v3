import { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";

const useFieldValue = <T>(
  fieldName: string,
  defaultValue?: T
): [T, (newValue: T, options?: { shouldDirty?: boolean }) => void] => {
  const ctx = useFormContext();
  const value: T = ctx.watch(fieldName);
  // Dirty by default: what the user changes. A value the form fills in by
  // itself (a default, or one worked out on load) passes shouldDirty: false,
  // or an untouched form warns of unsaved changes when left.
  const setValue = (newValue: T, { shouldDirty = true } = {}) =>
    ctx.setValue(fieldName, newValue, { shouldDirty });
  useEffect(() => {
    if (typeof value == "undefined" && typeof defaultValue != "undefined") {
      ctx.setValue(fieldName, defaultValue);
    }
  }, [value]);

  const rV = useMemo(
    () => (typeof value == "undefined" ? defaultValue : value) as T,
    [value, defaultValue]
  );
  return [rV, setValue];
};

export default useFieldValue;
