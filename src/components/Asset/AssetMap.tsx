import React, { useEffect } from "react";
import useBoolean from "hooks/useBoolean";
import { useListController } from "react-admin";

const AssetMap = () => {
  const { data, ...lc } = useListController();
  useEffect(() => {
    lc.setPerPage(lc.total);
    () => lc.setPerPage(10);
  }, [data]);

  const unsaved = useBoolean(false);

  return <div>{JSON.stringify(data?.length)}</div>;
};

export default AssetMap;
