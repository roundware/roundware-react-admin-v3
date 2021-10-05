export const dateFormatter = (v: string) => {
  if (!v) return;
  return new Date(v).toISOString();
};
