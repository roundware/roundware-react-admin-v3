import { tokenAuthProvider } from "ra-data-roundware-drf";
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
import { Route } from "react-router-dom";
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
import { SpeakerCreate, SpeakerEdit } from "components/Speaker";
import SpeakerList from "components/Speaker/SpeakerList";
import { useRoundwareDataProvider } from "providers/DataProviderContext";
import { UiGroupCreate, UiGroupEdit } from "components/UIGroup/index";
import { UiGroupList } from "components/UIGroup/UIGroupsList";

const authProvider = tokenAuthProvider({
  obtainAuthTokenUrl: `${process.env.REACT_APP_SERVER_URL}/api/2/login/`,
});

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
      list={ListGuesser}
      edit={EditGuesser}
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

  uiitems: (
    <Resource
      name="uiitems"
      key="uiitems"
      list={ListGuesser}
      edit={EditGuesser}
      icon={FeaturedPlayList}
      options={{ label: "UI Items" }}
    />
  ),

  tags: (
    <Resource
      name="tags"
      key="tags"
      list={ListGuesser}
      edit={EditGuesser}
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
      list={ListGuesser}
      edit={EditGuesser}
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

function App(): JSX.Element {
  const { selectedProject } = useProjects();
  const dataProvider = useRoundwareDataProvider();
  return (
    <Admin
      theme={adminTheme}
      layout={CustomLayout}
      title="Roundware Admin"
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      dataProvider={dataProvider}
      authProvider={authProvider}
      // customRoutes={[
      //   <Route component={BuildUi} key="buildui" path={`/buildui`} />,
      // ]}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      dashboard={selectedProject && Dashboard}
      // eslint-disable-next-line react/no-children-prop
      children={[
        <Resource
          name="projects"
          key="projects"
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
