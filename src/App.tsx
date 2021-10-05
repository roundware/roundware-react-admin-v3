import drfProvider, {
  CustomDataProvider,
  fetchJsonWithAuthToken,
  tokenAuthProvider,
} from "ra-data-roundware-drf";
import React from "react";
import {
  Admin,
  Resource,
  ShowGuesser,
  ListGuesser,
  EditGuesser,
} from "react-admin";
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
const dataProvider = drfProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  fetchJsonWithAuthToken
);

const customDataProvider = {
  ...dataProvider,
  // @ts-ignore
  getOne: async (resource, params, query) => {
    console.log(`getOne called`, resource, params, query);
    // @ts-ignore
    return dataProvider.getOne(resource, params, query);
  },
};

function App() {
  return (
    <Admin
      theme={adminTheme}
      layout={CustomLayout}
      title="Roundware Admin"
      // @ts-ignore
      dataProvider={customDataProvider}
      authProvider={authProvider}
      dashboard={Dashboard}
    >
      <Resource
        name="projects"
        list={ProjectList}
        create={ProjectCreate}
        edit={ProjectEdit}
        show={ProjectShow}
        icon={AccountTree}
      />

      <Resource
        name="assets"
        list={AssetList}
        create={AssetCreate}
        edit={AssetEdit}
        options={{ label: "Assets" }}
        icon={WebAsset}
      />

      <Resource
        name="audiotracks"
        list={ListGuesser}
        edit={EditGuesser}
        icon={Audiotrack}
        options={{ label: "Audio Tracks" }}
      />

      <Resource
        name="envelopes"
        list={ListGuesser}
        edit={EditGuesser}
        icon={Email}
      />
      <Resource
        name="events"
        list={ListGuesser}
        edit={EditGuesser}
        icon={Event}
      />

      <Resource
        name="listenevents"
        list={ListenEventsList}
        edit={ListenEventsEdit}
        create={ListenEventsCreate}
        icon={Hearing}
        options={{ label: "Listen Events" }}
      />

      <Resource
        name="sessions"
        list={SessionList}
        edit={SessionEdit}
        create={SessionCreate}
        icon={AccessTime}
      />

      <Resource
        name="speakers"
        list={ListGuesser}
        edit={EditGuesser}
        icon={Speaker}
      />

      <Resource
        name="uigroups"
        list={ListGuesser}
        edit={EditGuesser}
        icon={Build}
        options={{ label: "UI Groups" }}
      />

      <Resource
        name="uiitems"
        list={ListGuesser}
        edit={EditGuesser}
        icon={FeaturedPlayList}
        options={{ label: "UI Items" }}
      />

      <Resource
        name="tags"
        list={ListGuesser}
        edit={EditGuesser}
        icon={TagFaces}
      />
      <Resource
        name="tag_categories"
        options={{
          label: "Tag Categories",
        }}
        list={ListGuesser}
        edit={EditGuesser}
        icon={Label}
      />
      <Resource
        name="languages"
        list={ListGuesser}
        edit={EditGuesser}
        icon={Language}
      />
      <Resource
        name="localizedstrings"
        options={{
          label: "Localized Strings",
        }}
        list={ListGuesser}
        edit={EditGuesser}
        icon={Translate}
      />
      <Resource
        name="users"
        list={ListGuesser}
        edit={EditGuesser}
        icon={PeopleAlt}
      />
    </Admin>
  );
}

export default App;
