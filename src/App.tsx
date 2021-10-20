import {
  fetchJsonWithAuthToken,
  tokenAuthProvider,
  RoundwareDataProvider,
} from "ra-data-roundware-drf";
import React from "react";
import { Admin, Resource, ListGuesser, EditGuesser } from "react-admin";
import AssetCreate from "./components/Asset/AssetCreate";
import AssetEdit from "./components/Asset/AssetEdit";
import AssetList from "./components/Asset/AssetList";
import CustomLayout from "./components/Layout";
import Dashboard from "./components/Layout/Dashboard";
import ProjectCreate from "./components/Project/ProjectCreate";
import ProjectEdit from "./components/Project/ProjectEdit";
import ProjectList from "./components/Project/ProjectList";
import { useProjects } from "./providers/ProjectsContext";
import adminTheme from "./styles";
import {
  WebAsset,
  Language,
  Translate,
  Label,
  TagFaces,
  PeopleAlt,
  Audiotrack,
  Speaker,
  Email,
  Event,
  Hearing,
  AccessTime,
  Build,
  FeaturedPlayList,
  AccountTree,
} from "@material-ui/icons";
import ProjectShow from "./components/Project/ProjectShow";
import {
  ListenEventsCreate,
  ListenEventsEdit,
  ListenEventsList,
} from "./components/ListenEvents";
import { SessionCreate, SessionEdit, SessionList } from "./components/Session";
const authProvider = tokenAuthProvider({
  obtainAuthTokenUrl: `${process.env.REACT_APP_SERVER_URL}/api/2/login/`,
});
const dataProvider = new RoundwareDataProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  fetchJsonWithAuthToken
);

const resourceLookup: { [index: string]: React.ReactNode } = {
  assets: (
    <Resource
      name="assets"
      list={AssetList}
      create={AssetCreate}
      edit={AssetEdit}
      options={{ label: "Assets" }}
      icon={WebAsset}
    />
  ),
  audiotracks: (
    <Resource
      name="audiotracks"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Audiotrack}
      options={{ label: "Audio Tracks" }}
    />
  ),
  envelopes: (
    <Resource
      name="envelopes"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Email}
    />
  ),
  events: (
    <Resource
      name="events"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Event}
    />
  ),

  listenevents: (
    <Resource
      name="listenevents"
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
      list={SessionList}
      edit={SessionEdit}
      create={SessionCreate}
      icon={AccessTime}
    />
  ),

  speakers: (
    <Resource
      name="speakers"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Speaker}
    />
  ),

  uigroups: (
    <Resource
      name="uigroups"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Build}
      options={{ label: "UI Groups" }}
    />
  ),

  uiitems: (
    <Resource
      name="uiitems"
      list={ListGuesser}
      edit={EditGuesser}
      icon={FeaturedPlayList}
      options={{ label: "UI Items" }}
    />
  ),

  tags: (
    <Resource
      name="tags"
      list={ListGuesser}
      edit={EditGuesser}
      icon={TagFaces}
    />
  ),
  tag_categories: (
    <Resource
      name="tag_categories"
      options={{
        label: "Tag Categories",
      }}
      list={ListGuesser}
      edit={EditGuesser}
      icon={Label}
    />
  ),
  languages: (
    <Resource
      name="languages"
      list={ListGuesser}
      edit={EditGuesser}
      icon={Language}
    />
  ),
  localizedstrings: (
    <Resource
      name="localizedstrings"
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
      list={ListGuesser}
      edit={EditGuesser}
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

function App() {
  const { selectedProject } = useProjects();

  return (
    <Admin
      theme={adminTheme}
      layout={CustomLayout}
      title="Roundware Admin"
      // @ts-ignore
      dataProvider={dataProvider}
      authProvider={authProvider}
      // @ts-ignore
      dashboard={selectedProject && Dashboard}
      children={[
        <Resource
          name="projects"
          list={ProjectList}
          create={ProjectCreate}
          edit={ProjectEdit}
          show={ProjectShow}
          icon={AccountTree}
        />,
        ...(process.env.REACT_APP_INCLUDE_TABS === "all"
          ? Object.values(resourceLookup)
          : process.env.REACT_APP_INCLUDE_TABS?.split(`,`)
              ?.filter((r) => Object.keys(resourceLookup).includes(r))
              .map((r) => resourceLookup[r]) || []),
      ]}
    />
  );
}

export default App;
