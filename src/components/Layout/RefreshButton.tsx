import RefreshIcon from "@mui/icons-material/Refresh";
import { CircularProgress, IconButton } from "@mui/material";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import { useProjects } from "context/ProjectsContext";
import React, { useState } from "react";
import { useNotify, useRefresh } from "react-admin";
import { useLocation } from "react-router-dom";

const RefreshButton = () => {
  const refresh = useRefresh();

  const dataProvider = useRoundwareDataProvider();
  const location = useLocation();
  const notify = useNotify();
  const [loading, setLoading] = useState(false);

  const { selectedProject } = useProjects();

  const startUrl = `/project/${selectedProject?.id}`;
  return (
    <IconButton
      disabled={loading}
      onClick={async () => {
        setLoading(true);
        try {
          await dataProvider.getList(
            location.pathname.slice(
              location.pathname.indexOf(startUrl) + startUrl.length + 1
            ),
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
