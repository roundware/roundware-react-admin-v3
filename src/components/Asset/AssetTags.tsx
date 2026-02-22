import { Chip, Stack } from "@mui/material";
import React from "react";
import { useGetOne } from "react-admin";

interface TagDisplayProps {
  tagId: number;
}
export const TagDisplay = ({ tagId }: TagDisplayProps) => {
  const tag = useGetOne(`tags`, {
    id: tagId,
  });
  if (tag.data) {
    return (
      <>
        <Chip size="small" label={tag.data.description} />
        <br />
      </>
    );
  } else {
    return null;
  }
};

export const TagsDisplay = ({ tagIds }: { tagIds: number[] }) => {
  return (
    <Stack direction="row" flexWrap={"wrap"} spacing={0.2}>
      {tagIds.map((tagId: number) => (
        <React.Fragment key={tagId}>
          <TagDisplay tagId={tagId} />
        </React.Fragment>
      ))}
    </Stack>
  );
};
