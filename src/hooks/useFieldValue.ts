import { useEffect } from "react";
import { useFormContext } from "react-hook-form";

const useFieldValue = <T>(
  fieldName: string,
  defaultValue?: T
): [T, (newValue: T) => void] => {
  const ctx = useFormContext();
  const value: T = ctx.watch(fieldName);
  const setValue = (newValue: T) =>
    ctx.setValue(fieldName, newValue, {
      shouldDirty: true,
    });
  useEffect(() => {
    if (typeof value == "undefined" && defaultValue) setValue(defaultValue);
  }, [value]);

  const rV = (typeof value == "undefined" ? defaultValue : value) as T;
  return [rV, setValue];
};

export default useFieldValue;
