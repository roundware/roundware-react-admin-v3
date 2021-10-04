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
} from "@material-ui/icons";
const authProvider = tokenAuthProvider({
  obtainAuthTokenUrl: `${process.env.REACT_APP_SERVER_URL}/api/2/login/`,
});
const dataProvider = drfProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  fetchJsonWithAuthToken
);

function App() {
  return (
    <Admin
      theme={adminTheme}
      layout={CustomLayout}
      title="Roundware Admin"
      // @ts-ignore
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
      <Resource
        name="projects"
        list={ProjectList}
        create={ProjectCreate}
        edit={ProjectEdit}
        show={ShowGuesser}
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
        name="tagcategories"
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
