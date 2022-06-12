import React, { useState } from "react";
import { CircularProgress, IconButton } from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import {
  useNotify,
  useRefresh,
  useResourceContext,
  useResourceDefinition,
} from "react-admin";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { useLocation } from "react-router-dom";

type Props = {};

const RefreshButton = (props: Props) => {
  const refresh = useRefresh();

  const dataProvider = useRoundwareDataProvider();
  const rm = useLocation();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);
  return (
    <IconButton
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await dataProvider.getList(
            rm.pathname.slice(1),
            {
              pagination: {
                perPage: 0,
                page: 0,
              },
              filter: {},
              sort: {
                field: "id",
                order: "ASC",
              },
              meta: {},
            },
            true
          );
        } catch (e) {
          notify(`Failed to refresh: ${e}`, {
            type: "error",
          });
        } finally {
          refresh();
          setLoading(false);
        }
      }}
    >
      {loading ? (
        <CircularProgress
          size="small"
          sx={{
            color: "white",
          }}
        />
      ) : (
        <RefreshIcon
          sx={{
            color: "white",
          }}
        />
      )}
    </IconButton>
  );
};

export default RefreshButton;
