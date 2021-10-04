import drfProvider, {
  CustomDataProvider, fetchJsonWithAuthToken, tokenAuthProvider
} from "ra-data-roundware-drf";
import React from "react";
import { Admin, Resource } from "react-admin";
import AssetCreate from "./components/AssetCreate";
import AssetEdit from "./components/AssetEdit";
import AssetList from "./components/AssetList";
import CustomLayout from "./components/Layout";
import Dashboard from "./components/Layout/Dashboard";
import ProjectCreate from "./components/ProjectCreate";
import ProjectEdit from "./components/ProjectEdit";
import ProjectList from "./components/ProjectList";
import { useProjects } from "./providers/ProjectsContext";
import adminTheme from "./styles";

const authProvider = tokenAuthProvider({
  obtainAuthTokenUrl: `${process.env.REACT_APP_SERVER_URL}/api/2/login/`,
});
const dataProvider = drfProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  fetchJsonWithAuthToken
);

const customDataProvider: CustomDataProvider = {
  ...dataProvider,
  getList: async (resource, params) => {
    if (resource === "assets") return await dataProvider.getList(resource, params, true);
    return await dataProvider.getList(resource, params);
  },

};

function App() {
  const { selectedProject } = useProjects();

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
      />

      <Resource
        name="assets"
        list={AssetList}
        create={AssetCreate}
        edit={AssetEdit}
      />
      <Resource name="tags" />
      <Resource name="languages" />
      <Resource name="localizedstrings" />
      <Resource name="users" />
    </Admin>
  );
}

export default App;
