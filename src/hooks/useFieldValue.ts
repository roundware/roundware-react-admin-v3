import { useFormContext } from "react-hook-form";

const useFieldValue = <T>(
  fieldName: string,
  defaultValue?: T
): [T, (newValue: T) => void] => {
  const ctx = useFormContext();
  const value: T = ctx.watch(fieldName);
  const setValue = (newValue: T) => ctx.setValue(fieldName, newValue);
  return [value, setValue];
};

export default useFieldValue;
