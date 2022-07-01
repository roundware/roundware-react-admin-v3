import { AssetInfoWindowInner } from "components/Asset/AssetInfoWindow";
import useBoolean, { UseBooleanType } from "hooks/useBoolean";
import React, { PropsWithChildren, useState } from "react";
import { useListController } from "react-admin";
import { IAsset } from "types/asset";

type AssetContextType = {
  handleSave: () => Promise<void>;
  promises: {
    id: number;
    promise: () => Promise<any>;
  }[];
  setPromises: React.Dispatch<
    React.SetStateAction<
      {
        id: number;
        promise: () => Promise<any>;
      }[]
    >
  >;
  saving: UseBooleanType;
  selectedAsset: IAsset | null;
  setSelectedAsset: React.Dispatch<React.SetStateAction<IAsset | null>>;
};
const AssetMapContext = React.createContext<AssetContextType>(undefined!);
export const useAssetMapContext = () => React.useContext(AssetMapContext);

export const AssetMapContextProvider = (props: PropsWithChildren<{}>) => {
  const [promises, setPromises] = useState<AssetContextType[`promises`]>([]);
  const [selectedAsset, setSelectedAsset] = useState<IAsset | null>(null);
  const { refetch } = useListController();
  const saving = useBoolean();
  const handleSave = async () => {
    saving.setTrue();
    try {
      await Promise.all(promises.map((p) => p.promise()));
      setPromises([]);
      refetch({});
    } catch (e) {
      alert(e);
    } finally {
      saving.setFalse();
    }
  };

  return (
    <AssetMapContext.Provider
      value={{
        promises,
        setPromises,
        saving,
        handleSave,
        selectedAsset,
        setSelectedAsset,
      }}
    >
      {props.children}
    </AssetMapContext.Provider>
  );
};
