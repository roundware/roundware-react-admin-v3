import { Button, Dialog, DialogActions, DialogContent } from "@mui/material";
import { AssetInfoWindowInner } from "components/Asset/AssetInfoWindow";
import useBoolean, { UseBooleanType } from "hooks/useBoolean";
import { useCallbackPrompt } from "hooks/useCallbackPrompt";
import React, { PropsWithChildren, useLayoutEffect, useState } from "react";
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

export const AssetMapContextProvider = (
  props: PropsWithChildren<{ selectedAsset?: IAsset }>
) => {
  const [promises, setPromises] = useState<AssetContextType[`promises`]>([]);
  const [selectedAsset, setSelectedAsset] = useState<IAsset | null>(null);
  const { refetch, setPerPage, total } = useListController();
  const saving = useBoolean();
  useLayoutEffect(() => {
    setPerPage(total);
    refetch();
  }, [total]);
  const [showPromp, confirmNav, cancelNav] = useCallbackPrompt(
    promises.length != 0
  );
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
      <Dialog open={showPromp as boolean}>
        <DialogContent>
          You save some unsaved changes in Assets Map. Are you sure you want to
          leave?
        </DialogContent>
        <DialogActions>
          <Button onClick={confirmNav as () => void}>Yes</Button>
          <Button onClick={cancelNav as () => void}>No</Button>
        </DialogActions>
      </Dialog>
    </AssetMapContext.Provider>
  );
};
