import React from 'react';
import { Admin, Resource } from 'react-admin';
import drfProvider, { tokenAuthProvider, fetchJsonWithAuthToken } from 'ra-data-django-rest-framework';
import ProjectList from './components/ProjectList';
import AssetList from './components/AssetList';

const authProvider = tokenAuthProvider({ "obtainAuthTokenUrl": 'https://prod.roundware.com/api/2/login/' });
const dataProvider = drfProvider('https://prod.roundware.com/api/2/', fetchJsonWithAuthToken);

function App() {
  return (
    <Admin
      dataProvider={dataProvider}
      authProvider={authProvider}
    >
      <Resource name='assets' list={AssetList} />
    </Admin>
  )
}

export default App;
