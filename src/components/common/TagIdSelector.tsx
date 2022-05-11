import { LinearProgress, TextField } from "@mui/material";
import { Autocomplete } from '@mui/material';
import useFieldValue from "hooks/useFieldValue";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import React, { useEffect, useState } from "react";
import { ITag, ITagCategory } from "types/tags";
interface Props {
  source: string;
  label?: string;
  multiple?: boolean;
}

const options = {
  filter: {},
  pagination: {
    perPage: 0,
    page: 0,
  },
  sort: {
    field: "id",
    order: "ASC",
  },
};
type TagWithCategory = Exclude<ITag, "tag_category_id"> & {
  category_name: string;
};
const TagIdSelector = ({ label, source, multiple }: Props): JSX.Element => {
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<TagWithCategory[]>([]);
  const dataProvider = useRoundwareDataProvider();
  const [value, setValue] = useFieldValue<number | number[] | undefined>(
    source
  );
  useEffect(() => {
    dataProvider
      .getList(`tagcategories`, options)
      .then(({ data: tagCategories }) => {
        dataProvider
          .getList(`tags`, options)
          .then(({ data }) => {
            const parsedList: TagWithCategory[] = (data as ITag[]).map(
              (t: ITag) => ({
                ...t,
                category_name:
                  (tagCategories as ITagCategory[]).find(
                    (c) => c.id == t.tag_category_id
                  )?.name || "",
              })
            );
            setTags(parsedList);
          })
          .then(() => setLoading(false));
      });
  }, []);
  console.log(value);
  if (loading) return <LinearProgress />;
  return (
    <Autocomplete
      options={tags}
      fullWidth
      groupBy={(option: TagWithCategory) => option?.category_name}
      getOptionLabel={(option: TagWithCategory) => option?.value}
      style={{ minWidth: 300, width: "100%", marginBottom: 16, marginTop: 16 }}
      onChange={(e, v: TagWithCategory[] | TagWithCategory | null) => {
        console.log(v);
        setValue(
          multiple
            ? Array.isArray(v)
              ? v?.map((t) => t?.id)
              : []
            : Array.isArray(v)
            ? undefined
            : v?.id
        );
      }}
      multiple={multiple}
      value={
        multiple
          ? Array.isArray(value)
            ? (value.map((v) =>
                tags.find((t) => t?.id == v)
              ) as TagWithCategory[])
            : ([] as TagWithCategory[])
          : (tags.find((t) => t?.id == value) as TagWithCategory)
      }
      renderInput={(params) => (
        <TextField
          {...params}
          fullWidth
          label={label}
          placeholder="Type to filter tags"
          variant="filled"
        />
      )}
    />
  );
};

export default TagIdSelector;
