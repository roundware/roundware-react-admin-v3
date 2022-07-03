import {
  AccessTime,
  AccountTree,
  Audiotrack,
  Build,
  Email,
  Event,
  Hearing,
  Label,
  Language,
  PeopleAlt,
  Speaker,
  TagFaces,
  Translate,
  WebAsset,
} from "@mui/icons-material";
import { Box } from "@mui/material";
import AssetMapPage from "components/Asset/AssetMapPage";
import {
  AudioTrackCreate,
  AudioTrackEdit,
  AudioTrackList,
} from "components/AudioTrack";
import { SpeakerCreate, SpeakerEdit } from "components/Speaker";
import SpeakerList from "components/Speaker/SpeakerList";
import { TagCreate, TagEdit, TagList } from "components/Tag";
import {
  TagCategoryCreate,
  TagCategoryEdit,
  TagCategoryList,
} from "components/TagCategory";
import {
  TimedAssetCreate,
  TimedAssetEdit,
  TimedAssetList,
} from "components/TimedAsset";
import { UiGroupCreate, UiGroupEdit } from "components/UIGroup/index";
import { UiGroupList } from "components/UIGroup/UIGroupsList";
import { UserCreate, UserEdit, UserList } from "components/User";
import { useRoundwareDataProvider } from "context/DataProviderContext";
import { createBrowserHistory } from "history";
import React from "react";
import {
  Admin,
  CustomRoutes,
  EditGuesser,
  ListGuesser,
  Resource,
} from "react-admin";
import { Route } from "react-router-dom";
import AssetCreate from "./components/Asset/AssetCreate";
import AssetEdit from "./components/Asset/AssetEdit";
import AssetList from "./components/Asset/AssetList";
import CustomLayout from "./components/Layout";
import Dashboard from "./components/Layout/Dashboard";
import {
  ListenEventsCreate,
  ListenEventsEdit,
  ListenEventsList,
} from "./components/ListenEvents";
import ProjectCreate from "./components/Project/ProjectCreate";
import ProjectEdit from "./components/Project/ProjectEdit";
import ProjectList from "./components/Project/ProjectList";
import ProjectShow from "./components/Project/ProjectShow";
import {
  SessionCreate,
  SessionEdit,
  SessionList,
} from "./components/Session/Session";
import SessionMap from "./components/Session/SessionMap";
import authProvider from "./context/AuthProvider";
import { useProjects } from "./context/ProjectsContext";
import adminTheme from "./styles";

const history = createBrowserHistory();
function App({ basename }: { basename: string }): JSX.Element {
  const { selectedProject } = useProjects();
  const dataProvider = useRoundwareDataProvider();

  return (
    <Admin
      theme={adminTheme}
      layout={CustomLayout}
      title="Roundware Admin"
      dataProvider={dataProvider}
      authProvider={authProvider}
      history={history}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      dashboard={Dashboard}
      basename={basename}
      // eslint-disable-next-line react/no-children-prop
      children={[
        <Resource
          name="projects"
          options={{
            label: `Projects`,
          }}
          key="projects"
          list={ProjectList}
          create={ProjectCreate}
          edit={ProjectEdit}
          show={ProjectShow}
          icon={AccountTree}
        />,
        ...(selectedProject && process.env.REACT_APP_INCLUDE_TABS === "all"
          ? Object.values(resourceLookup)
          : process.env.REACT_APP_INCLUDE_TABS?.split(`,`)
              ?.filter((r) => Object.keys(resourceLookup).includes(r))
              .map((r) => resourceLookup[r]) || []),
        <CustomRoutes key="custom-routes">
          <Route path="/assets/map" element={<AssetMapPage />} />
          <Route path={`/session_map/:sessionId`} element={<SessionMap />} />
        </CustomRoutes>,
      ]}
    />
  );
}
export const BaseApp = App;

export default App;
const resourceLookup: { [index: string]: React.ReactNode } = {
  assets: (
    <Resource
      name="assets"
      key="assets"
      list={AssetList}
      create={AssetCreate}
      edit={AssetEdit}
      options={{ label: "Assets" }}
      icon={WebAsset}
    />
  ),
  timedassets: (
    <Resource
      name="timedassets"
      key="timedassets"
      list={TimedAssetList}
      edit={TimedAssetEdit}
      create={TimedAssetCreate}
      icon={WebAsset}
      options={{ label: "Timed Assets" }}
    />
  ),
  uigroups: (
    <Resource
      name="uigroups"
      key="uigroups"
      list={UiGroupList}
      edit={UiGroupEdit}
      create={UiGroupCreate}
      icon={Build}
      options={{ label: "Build UI" }}
    />
  ),
  audiotracks: (
    <Resource
      name="audiotracks"
      key="audiotracks"
      list={AudioTrackList}
      edit={AudioTrackEdit}
      create={AudioTrackCreate}
      icon={Audiotrack}
      options={{ label: "Audio Tracks" }}
    />
  ),
  speakers: (
    <Resource
      name="speakers"
      key="speakers"
      list={SpeakerList}
      edit={SpeakerEdit}
      create={SpeakerCreate}
      icon={Speaker}
    />
  ),
  envelopes: (
    <Resource
      name="envelopes"
      key="envelopes"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Email}
    />
  ),
  events: (
    <Resource
      name="events"
      key="events"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Event}
    />
  ),

  listenevents: (
    <Resource
      name="listenevents"
      key="listenevents"
      list={ListenEventsList}
      edit={ListenEventsEdit}
      create={ListenEventsCreate}
      icon={Hearing}
      options={{ label: "Listen Events" }}
    />
  ),

  sessions: (
    <Resource
      name="sessions"
      key="sessions"
      list={SessionList}
      edit={SessionEdit}
      create={SessionCreate}
      icon={AccessTime}
    />
  ),

  // uiitems: (
  //   <Resource
  //     name="uiitems"
  //     key="uiitems"
  //     list={ListGuesser}
  //     edit={EditGuesser}
  //     icon={FeaturedPlayList}
  //     options={{ label: "UI Items" }}
  //   />
  // ),

  tags: (
    <Resource
      name="tags"
      key="tags"
      list={TagList}
      edit={TagEdit}
      create={TagCreate}
      icon={TagFaces}
    />
  ),
  tag_categories: (
    <Resource
      name="tagcategories"
      key="tagcategories"
      options={{
        label: "Tag Categories",
      }}
      list={TagCategoryList}
      edit={TagCategoryEdit}
      create={TagCategoryCreate}
      icon={Label}
    />
  ),
  languages: (
    <Resource
      name="languages"
      key="languages"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Language}
    />
  ),
  localizedstrings: (
    <Resource
      name="localizedstrings"
      key="localizedstrings"
      options={{
        label: "Localized Strings",
      }}
      list={ListGuesser}
      edit={EditGuesser}
      icon={Translate}
    />
  ),
  users: (
    <Resource
      name="users"
      key="users"
      list={UserList}
      edit={UserEdit}
      create={UserCreate}
      icon={PeopleAlt}
    />
  ),
};

export const ResourceList = [
  `projects`,
  ...(process.env.REACT_APP_INCLUDE_TABS === "all"
    ? Object.keys(resourceLookup)
    : process.env.REACT_APP_INCLUDE_TABS?.split(`,`)?.filter((r) =>
        Object.keys(resourceLookup).includes(r)
      ) || []),
];
