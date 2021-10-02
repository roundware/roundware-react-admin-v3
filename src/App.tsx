import React, { useEffect } from "react";
import { Admin, Resource, DataProvider } from "react-admin";
import drfProvider, {
  tokenAuthProvider,
  fetchJsonWithAuthToken,
} from "ra-data-django-rest-framework";
import ProjectList from "./components/ProjectList";
import ProjectCreate from "./components/ProjectCreate";
import ProjectEdit from "./components/ProjectEdit";
import AssetList from "./components/AssetList";
import AssetCreate from "./components/AssetCreate";
import AssetEdit from "./components/AssetEdit";
import adminTheme from "./styles";
import CustomLayout from "./components/Layout";
import { IProject, useProjects } from "./providers/ProjectsContext";
import Dashboard from "./components/Layout/Dashboard";

const authProvider = tokenAuthProvider({
  obtainAuthTokenUrl: `${process.env.REACT_APP_SERVER_URL}/api/2/login/`,
});
const dataProvider = drfProvider(
  `${process.env.REACT_APP_SERVER_URL}/api/2`,
  fetchJsonWithAuthToken
);

const customDataProvider: DataProvider = {
  ...dataProvider,
  getList: async (resource, params) => {
    if (resource === 'projects') {
      const {json}= await fetchJsonWithAuthToken(`${process.env.REACT_APP_SERVER_URL}/api/2/projects`, {});
      return {
        data: json,
        total: json?.length
      }
    }
    return dataProvider.getList(resource, params);
  }
} 

function App() {

  const { selectedProject } = useProjects()
  

  return (
    <Admin
      theme={adminTheme}
      layout={CustomLayout}
      title="Roundware Admin"
      dataProvider={customDataProvider}
      authProvider={authProvider}
      // @ts-ignore
      dashboard={selectedProject && Dashboard}
    >
      {!selectedProject ? <Resource
        name="projects"
        list={ProjectList}
        create={ProjectCreate}
        edit={ProjectEdit}
      /> : <><Resource
      name="assets"
      list={AssetList}
      create={AssetCreate}
      edit={AssetEdit}
    />
    <Resource name="tags" />
    <Resource name="languages" />
    <Resource name="localizedstrings" />
    <Resource name="users" /></>}
      
    </Admin>
  );
}

export default App;
