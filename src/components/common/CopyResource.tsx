import { IconButton, CircularProgress } from "@mui/material";
import React, { useState } from "react";
import CopyIcon from "@mui/icons-material/ContentCopy";
import {
  useDataProvider,
  useNotify,
  useRecordContext,
  useRedirect,
  useRefresh,
} from "react-admin";
type Props = {
  onSuccess?: () => void;
};
const CopyResourceButton = ({
  onSuccess = () => console.log(`copied`),
}: Props) => {
  const [loading, setLoading] = useState(false);
  const record = useRecordContext();
  const dataProvider = useDataProvider();
  const redirect = useRedirect();
  const notify = useNotify();
  const refresh = useRefresh();

  const copy = async () => {
    try {
      setLoading(true);
      const resourceName = window.location.pathname.split(`/`).reverse()[0];
      const res = await dataProvider.create(resourceName, {
        data: record,
      });
      notify(`Successfully copied ${resourceName} ${record.id}`, {
        type: `success`,
      });
      onSuccess();
      refresh();
      await redirect(`edit`, `/speakers`, res.data.id);
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
