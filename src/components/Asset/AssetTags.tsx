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
        <span className="rw-tag">{tag.data.description}</span>
        <br />
      </>
    );
  } else {
    return null;
  }
};

export const TagsDisplay = ({ tagIds }: { tagIds: number[] }) => {
  return (
    <div className="rw-tags">
      {tagIds.map((tagId: number) => (
        <React.Fragment key={tagId}>
          <TagDisplay tagId={tagId} />
        </React.Fragment>
      ))}
    </div>
  );
};
