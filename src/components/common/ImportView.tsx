import UploadIcon from "@mui/icons-material/Upload";
import { LoadingButton } from "@mui/lab";
import {
  Button,
  Card,
  DialogActions,
  DialogContent,
  IconButton,
  Stack,
  Typography,
  Slide,
} from "@mui/material";
import AssetShape from "components/Asset/AssetShape";
import useBoolean from "hooks/useBoolean";
import React, { useState } from "react";
import {
  BooleanField,
  BooleanInput,
  ChipField,
  Datagrid,
  DateTimeInput,
  ListContextProvider,
  NumberField,
  NumberInput,
  Pagination,
  RecordContextProvider,
  ReferenceArrayField as RAF,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  SingleFieldList,
  TextInput,
  useNotify,
  useRecordContext,
  TextField,
} from "react-admin";
import { IAsset } from "types/asset";
import { csvToJSON } from "utils";
import AudioOptions from "./AudioOptions";
import EnvelopeIdSelector from "./EnvelopeIdSelector";
import FileDownloadButton from "./FileDownloadButton";
import LocationSelector from "./LocationSelector";
import TagIdSelector from "./TagIdSelector";
import TranslatableField from "./TranslatableField";
import ArrowLeft from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useProjects } from "providers/ProjectsContext";
import { AssetPreview } from "components/Asset/AssetList";
const ReferenceArrayField = React.memo(RAF);
const ImportView = () => {
  const [filter, setFilter] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const sort = { field: "id", order: "ASC" };
  const [data, setData] = useState<IAsset[]>([]);
  const total = data.length;
  const pc = useProjects();

  const filterValues = { q: filter };
  const setFilters = (filters: any) => setFilter(filters.q);
  const notify = useNotify();
  const processing = useBoolean();
  const handleOnFileUpload: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    if (!e.target.files) return;
    processing.setTrue();
    try {
      const files = Array.from(e.target.files);
      const csvFiles = files.filter((f) => f.type == `text/csv`);

      const jsonData: Omit<IAsset, "project_id" | "id" | "created" | "file">[] =
        [];
      const promises = csvFiles.map((f) =>
        f.text().then((s) => {
          csvToJSON<IAsset>(s).forEach((a) => jsonData.push(a));
        })
      );
      await Promise.all(promises);
      console.log(files.map((f) => f.name));
      let filesOk = true;
      for (let index = 0; index < jsonData.length; index++) {
        const element = jsonData[index];
        if (!files.some((f) => f.name == element.filename)) {
          alert(`Please also attach file '${element.filename}'`);
          filesOk = false;
          break;
        }
      }
      if (!filesOk) return;
      setData(
        jsonData.map((r, index) => ({
          id: index,
          project_id: pc.selectedProject?.id as number,
          created: new Date().toISOString(),
          file: URL.createObjectURL(files.find((f) => f.name == r.filename)!),
          ...r,
        }))
      );
    } catch (e) {
      console.error(e);
      notify(`Failed to prase CSV: ${e}`, {
        type: `error`,
      });
    } finally {
      processing.setFalse();
    }
  };

  const [editRecord, setEditRecord] = useState<IAsset | null>(null);

  return (
    <>
      {editRecord && (
        <Slide in={!!editRecord} direction="left">
          <Stack spacing={1}>
            <Stack direction="row" ml={2} spacing={1} alignItems="center">
              <IconButton onClick={() => setEditRecord(null)}>
                <ArrowLeft />
              </IconButton>
              <Typography variant="h6">Edit</Typography>
            </Stack>
            {editRecord && (
              <EditForm
                onSubmit={(newAsset) => {
                  setData((prev) =>
                    [...prev].map((d) => (d.id == newAsset.id ? newAsset : d))
                  );
                  setEditRecord(null);
                }}
                record={editRecord}
              />
            )}
          </Stack>
        </Slide>
      )}
      {!editRecord && (
        <Slide in={!editRecord} direction="right">
          <div>
            <DialogContent sx={{ p: 1 }}>
              <ListContextProvider
                value={{
                  data,
                  total,
                  page,
                  perPage,
                  setPage,
                  filterValues,
                  setFilters,
                  sort,
                }}
              >
                <div>
                  <Card>
                    <Datagrid>
                      <AssetPreview />
                      <BooleanField source="submitted" />
                      <TextField source="description" />
                      <TextField source="media_type" label="Media Type" />
                      <NumberField
                        source="latitude"
                        options={{ maximumFractionDigits: 8 }}
                      />
                      <NumberField
                        source="longitude"
                        options={{ maximumFractionDigits: 8 }}
                      />

                      <ReferenceArrayField
                        label="Tags"
                        reference="tags"
                        source="tag_ids"
                      >
                        <SingleFieldList>
                          <ChipField source="msg_loc" />
                        </SingleFieldList>
                      </ReferenceArrayField>

                      <EditButton onEdit={(a) => setEditRecord(a)} />
                    </Datagrid>
                  </Card>
                  <Pagination />
                </div>
              </ListContextProvider>
            </DialogContent>
            <DialogActions>
              <LoadingButton
                loading={processing.value}
                startIcon={<UploadIcon />}
                component="label"
                sx={{ mr: 2 }}
              >
                Select CSV &amp; Audio Files
                <input
                  type="file"
                  onChange={handleOnFileUpload}
                  hidden
                  multiple
                />
              </LoadingButton>
              <Button variant="contained">Save</Button>
            </DialogActions>
          </div>
        </Slide>
      )}
    </>
  );
};

export default ImportView;
const EditButton = ({ onEdit }: { onEdit: (asset: IAsset) => void }) => {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Button startIcon={<EditIcon />} onClick={() => onEdit(record as IAsset)}>
      Edit
    </Button>
  );
};
const EditForm = ({
  record,
  onSubmit,
}: {
  record: IAsset;
  onSubmit: (newAsset: IAsset) => void;
}) => {
  return (
    <RecordContextProvider value={record}>
      <SimpleForm
        warnWhenUnsavedChanges
        onSubmit={(fv) => onSubmit(fv as IAsset)}
      >
        <ReferenceInput
          label="Project"
          source="project_id"
          reference="projects"
        >
          <SelectInput source="name" fullWidth />
        </ReferenceInput>

        <SelectInput
          source="media_type"
          choices={[
            { id: "audio", name: "audio" },
            { id: "photo", name: "photo" },
            { id: "text", name: "text" },
            // { id: "video", name: "video" },
          ]}
          fullWidth
        />

        <AudioOptions />
        <FileDownloadButton source="file" />
        <LocationSelector
          fieldNames={{
            latitude: `latitude`,
            longitude: `longitude`,
          }}
        >
          <AssetShape />
        </LocationSelector>

        <NumberInput source="session_id" fullWidth />
        <ReferenceInput label="User" source="user.id" reference="users">
          <SelectInput optionText="username" fullWidth />
        </ReferenceInput>
        <TextInput multiline source="description" fullWidth />
        <DateTimeInput source="created" fullWidth />
        <DateTimeInput source="updated" fullWidth />
        <BooleanInput source="submitted" fullWidth />
        <ReferenceInput
          label="Language"
          source="language_id"
          reference="languages"
        >
          <SelectInput source="name" fullWidth />
        </ReferenceInput>
        <TagIdSelector source="tag_ids" multiple label="Tags" />
        <TranslatableField
          source="loc_description_admin"
          label="Description Localized"
        />

        <TranslatableField source="loc_alt_text_admin" label="Alt Text" />

        <EnvelopeIdSelector />
      </SimpleForm>
    </RecordContextProvider>
  );
};
