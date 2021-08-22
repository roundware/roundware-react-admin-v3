import React from "react";
import { Admin, Resource } from "react-admin";
import drfProvider, { tokenAuthProvider, fetchJsonWithAuthToken } from "ra-data-django-rest-framework";
import ProjectList from "./components/ProjectList";
import ProjectCreate from "./components/ProjectCreate";
import ProjectEdit from "./components/ProjectEdit";
import AssetList from "./components/AssetList";
import AssetCreate from "./components/AssetCreate";
import AssetEdit from "./components/AssetEdit";

const authProvider = tokenAuthProvider({ "obtainAuthTokenUrl": "http://localhost:8888/api/2/login/" });
const dataProvider = drfProvider("http://localhost:8888/api/2", fetchJsonWithAuthToken);

function App() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
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
  )
}

export default App;
