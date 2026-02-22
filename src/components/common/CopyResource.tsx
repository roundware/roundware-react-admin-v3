import { IconButton, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import CopyIcon from "@mui/icons-material/ContentCopy";
import {
  RaRecord,
  useDataProvider,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
} from "react-admin";
import { cloneDeep } from "lodash";
type Props = {
  onSuccess?: () => void;
  assignFirst?: () => Promise<object>;
  transform?: (d: Omit<RaRecord, "id">) => Omit<RaRecord, "id">;
};
const CopyResourceButton = ({
  onSuccess = () => undefined,
  assignFirst = async () => ({}),
  transform = (a) => a,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const r = useRecordContext();
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  const copy = async () => {
    try {
      const record: Omit<Partial<typeof r>, "id"> = cloneDeep(r);
      setLoading(true);
      const resourceName = window.location.pathname.split(`/`).reverse()[0];
      const a = await assignFirst();

      if (record.id) delete record.id;
      const res = await dataProvider.create(resourceName, {
        data: Object.assign(transform(record), a),
      });
      notify(`Successfully copied ${resourceName} ${record.id}`, {
        type: `success`,
      });
      onSuccess();
      refresh();
      await redirect(`edit`, `/${resourceName}`, res.data.id);
    } catch {
      notify(`Something went wrong!`, {
        type: `error`,
      });
    } finally {
      setLoading(false);
    }
  };
  return (
    <IconButton title="Copy" onClick={copy}>
      {loading ? <CircularProgress size="small" /> : <CopyIcon />}
    </IconButton>
  );
};

export default CopyResourceButton;
