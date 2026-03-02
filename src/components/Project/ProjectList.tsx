import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import {
    Box,
    CardActionArea,
    Checkbox,
    Container,
    Grid,
    IconButton,
    TextField,
    Tooltip,
    Typography,
} from "@mui/material";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import React, { useState } from "react";
import { List, usePermissions } from "react-admin";
import { useNavigate } from "react-router-dom";
import { IProject, useProjects } from "../../context/ProjectsContext";
import DeleteProjectDialog from "./DeleteProjectDialog";

const ProjectList = (): JSX.Element => {
  const { setProjectsList } = useProjects();
  return (
    <List
      pagination={false}
      queryOptions={{
        onSuccess: (data) => {
          setProjectsList(data.data);
        },
      }}
      perPage={0}
      component={ProjectCardWrapper}
    >
      <ProjectCard />
    </List>
  );
};

const ProjectCardWrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <Container>
      <Grid alignContent="center" container spacing={2}>
        {children}
      </Grid>
    </Container>
  );
};

const ProjectCard = () => {
  const { selectProject, projectsList, refetch } = useProjects();
  const navigate = useNavigate();
  const { permissions } = usePermissions();

  const [textFilter, setTextFilter] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<
    { id: number; name: string }[] | null
  >(null);

  const handleOnProjectSelect = (p: IProject) => {
    if (selectMode) {
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(p.id)) next.delete(p.id);
        else next.add(p.id);
        return next;
      });
      return;
    }
    selectProject(p);
    navigate(`/project/${p.id}/`);
  };

  const handleDeleteSingle = (
    e: React.MouseEvent,
    p: { id: number; name: string }
  ) => {
    e.stopPropagation();
    setDeleteTarget([p]);
  };

  const handleBulkDelete = () => {
    if (!projectsList) return;
    const toDelete = projectsList
      .filter((p) => selected.has(p.id))
      .map((p) => ({ id: p.id, name: p.name }));
    if (toDelete.length > 0) setDeleteTarget(toDelete);
  };

  const handleDeleted = () => {
    setSelected(new Set());
    setSelectMode(false);
    refetch();
  };

  const possibleProjects = (
    import.meta.env.VITE_INCLUDE_PROJECT_IDS || "all"
  ).split(`,`);
  const allowedProjectIds: number[] | null = permissions?.project_ids ?? null;
  const canDelete =
    permissions?.role === "superuser" ||
    permissions?.role === "owner" ||
    permissions?.role === "admin";

  const filteredProjects = Array.isArray(projectsList)
    ? projectsList
        .filter((p) =>
          textFilter
            ? p?.name?.toLowerCase().indexOf(textFilter?.toLowerCase()) !== -1
            : true
        )
        .filter((p) => {
          if (
            !possibleProjects.includes("all") &&
            !possibleProjects.includes(p.id.toString())
          )
            return false;
          if (
            allowedProjectIds !== null &&
            !allowedProjectIds.includes(p.id)
          )
            return false;
          return true;
        })
    : [];

  return (
    <>
      <Grid size={{ xs: 12 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <TextField
            placeholder="Search By Project Name"
            onChange={(e) => setTextFilter(e.target.value)}
            value={textFilter}
            InputProps={{
              startAdornment: <SearchIcon />,
            }}
          />
          {canDelete && (
            <Box sx={{ display: "flex", gap: 1, ml: "auto" }}>
              {selectMode ? (
                <>
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setSelectMode(false);
                      setSelected(new Set());
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    disabled={selected.size === 0}
                    onClick={handleBulkDelete}
                  >
                    Delete ({selected.size})
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  startIcon={<DeleteIcon />}
                  onClick={() => setSelectMode(true)}
                >
                  Bulk Delete
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Grid>
      <Grid>
        <CreateProjectCard />
      </Grid>
      {filteredProjects.map((p) => (
        <Grid key={p?.id}>
          <Card
            onClick={() => handleOnProjectSelect(p)}
            sx={{
              width: 275,
              height: 160,
              position: "relative",
              outline: selected.has(p.id)
                ? "2px solid"
                : undefined,
              outlineColor: selected.has(p.id)
                ? "error.main"
                : undefined,
            }}
          >
            <CardActionArea
              sx={{
                display: "flex",
                justifyContent: "center",
                flexDirection: "column",
                height: "100%",
                padding: 2,
              }}
            >
              {selectMode && (
                <Checkbox
                  checked={selected.has(p.id)}
                  sx={{ position: "absolute", top: 0, left: 0 }}
                  color="error"
                  onClick={(e) => e.stopPropagation()}
                  onChange={() => {
                    setSelected((prev) => {
                      const next = new Set(prev);
                      if (next.has(p.id)) next.delete(p.id);
                      else next.add(p.id);
                      return next;
                    });
                  }}
                />
              )}
              <Typography
                sx={{ fontSize: 14 }}
                color="textSecondary"
                gutterBottom
              >
                Project #{p?.id}
              </Typography>
              <Typography variant="h5" component="h2">
                {p?.name}
              </Typography>
              <Typography sx={{ mb: 1.5 }} color="textSecondary">
                Created:{" "}
                {p?.created_at
                  ? new Date(p.created_at).toLocaleString()
                  : "—"}
              </Typography>
            </CardActionArea>
            {canDelete && !selectMode && (
              <Tooltip title="Delete project">
                <IconButton
                  size="small"
                  color="error"
                  sx={{ position: "absolute", top: 4, right: 4 }}
                  onClick={(e) => handleDeleteSingle(e, p)}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Card>
        </Grid>
      ))}

      {deleteTarget && (
        <DeleteProjectDialog
          open
          projects={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
};

const CreateProjectCard = () => {
  const navigate = useNavigate();
  return (
    <Card
      sx={{ width: 275, height: 160 }}
      onClick={() => navigate(`/wizard`)}
    >
      <CardActionArea
        sx={{
          display: "flex",
          justifyContent: "center",
          flexDirection: "column",
          height: "100%",
        }}
      >
        <AddIcon fontSize="large" />
        <Typography variant="h6" component="h2">
          Create new Project
        </Typography>
      </CardActionArea>
    </Card>
  );
};

export default ProjectList;
