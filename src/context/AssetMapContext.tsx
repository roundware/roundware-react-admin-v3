import useBoolean, { UseBooleanType } from "hooks/useBoolean";
import React, { PropsWithChildren, useState } from "react";
import { RaRecord, UpdateResult } from "react-admin";

type AssetContextType = {
  handleSave: () => Promise<void>;
  promises: {
    id: number;
    promise: () => Promise<UpdateResult<RaRecord>>;
  }[];
  setPromises: React.Dispatch<
    React.SetStateAction<
      {
        id: number;
        promise: () => Promise<UpdateResult<RaRecord>>;
      }[]
    >
  >;
  saving: UseBooleanType;
};
const AssetMapContext = React.createContext<AssetContextType>(undefined!);
export const useAssetMapContext = () => React.useContext(AssetMapContext);

export const AssetMapContextProvider = (props: PropsWithChildren<{}>) => {
  const [promises, setPromises] = useState<AssetContextType[`promises`]>([]);
  const saving = useBoolean();
  const handleSave = async () => {
    saving.setTrue();
    await Promise.all(promises.map((p) => p.promise));
    saving.setFalse();
  };
  return (
    <AssetMapContext.Provider
      value={{
        promises,
        setPromises,
        saving,
        handleSave,
      }}
    ></AssetMapContext.Provider>
  );
};
