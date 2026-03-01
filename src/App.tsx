import {
    AccessTime,
    AccountTree,
    Audiotrack,
    Build,
    Business,
    Email,
    Event,
    Hearing,
    Label,
    Language,
    Notifications,
    PeopleAlt,
    Speaker,
    TagFaces,
    Translate,
    WebAsset,
} from "@mui/icons-material";
import { createBrowserHistory } from "history";
import React from "react";
import { Admin, CustomRoutes, Resource } from "react-admin";
import { Route } from "react-router-dom";
import AssetCreate from "./components/Asset/AssetCreate";
import AssetEdit from "./components/Asset/AssetEdit";
import AssetList from "./components/Asset/AssetList";
import AssetMapPage from "./components/Asset/AssetMapPage";
import {
    AudioTrackCreate,
    AudioTrackEdit,
    AudioTrackList,
} from "./components/AudioTrack";
import {
    EnvelopeCreate,
    EnvelopeEdit,
    EnvelopeList,
} from "./components/Envelope";
import { EventsCreate, EventsEdit, EventsList } from "./components/Event";
import {
    LanguageCreate,
    LanguageEdit,
    LanguageList,
} from "./components/Language";
import CustomLayout from "./components/Layout";
import Dashboard from "./components/Layout/Dashboard";
import {
    ListenEventsCreate,
    ListenEventsEdit,
    ListenEventsList,
} from "./components/ListenEvents";
import {
    LocalizedStringCreate,
    LocalizedStringEdit,
    LocalizedStringList,
} from "./components/LocalizedString";
import {
    NotificationCreate,
    NotificationEdit,
    NotificationList,
} from "./components/Notification";
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
import { SpeakerCreate, SpeakerEdit } from "./components/Speaker";
import SpeakerList from "./components/Speaker/SpeakerList";
import { TagCreate, TagEdit, TagList } from "./components/Tag";
import {
    TagCategoryCreate,
    TagCategoryEdit,
    TagCategoryList,
} from "./components/TagCategory";
import { TenantCreate, TenantEdit, TenantList } from "./components/Tenant";
import {
    TimedAssetCreate,
    TimedAssetEdit,
    TimedAssetList,
} from "./components/TimedAsset";
import { UiGroupCreate, UiGroupEdit } from "./components/UIGroup/index";
import { UiGroupList } from "./components/UIGroup/UIGroupsList";
import { UserCreate, UserEdit, UserList } from "./components/User";
import authProvider from "./context/AuthProvider";
import { useRoundwareDataProvider } from "./context/DataProviderContext";
import { useProjects } from "./context/ProjectsContext";
import CustomLoginPage from "./pages/CustomLoginPage";
import TeamMembersPage from "./pages/TeamMembersPage";
import TenantSettingsPage from "./pages/TenantSettingsPage";
import adminTheme from "./styles";

const history = createBrowserHistory();
function App({ basename }: { basename: string }): JSX.Element {
  const { selectedProject } = useProjects();
  const dataProvider = useRoundwareDataProvider();

  // Determine edit capability from localStorage (outside Admin context, so no usePermissions)
  const canEdit = (() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "null");
      if (user?.is_superuser) return true;
      const tenants = JSON.parse(localStorage.getItem("tenants") || "[]");
      const slug = localStorage.getItem("tenant_slug");
      const tenant = tenants.find((t: { slug: string }) => t.slug === slug);
      const role = tenant?.role ?? "user";
      return ["owner", "admin", "editor"].includes(role);
    } catch {
      return false;
    }
  })();
  const lookup = buildResourceLookup(canEdit);

  return (
    <Admin
      theme={adminTheme}
      layout={CustomLayout}
      loginPage={CustomLoginPage}
      title="Roundware Admin"
      dataProvider={dataProvider}
      authProvider={authProvider}
      // @ts-expect-error legacy history prop
      history={history}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      dashboard={Dashboard}
      basename={basename}
       
      children={[
        <Resource
          name="projects"
          options={{
            label: `Projects`,
          }}
          key="projects"
          list={ProjectList}
          create={canEdit ? ProjectCreate : undefined}
          edit={canEdit ? ProjectEdit : undefined}
          show={ProjectShow}
          icon={AccountTree}
        />,
        ...(selectedProject && import.meta.env.VITE_INCLUDE_TABS === "all"
          ? Object.values(lookup)
          : import.meta.env.VITE_INCLUDE_TABS?.split(`,`)
              ?.filter((r: string) => Object.keys(lookup).includes(r))
              .map((r: string) => lookup[r]) || []),
        // Tenants resource — always registered; menu entry hidden for non-superusers
        // (Menu.tsx runs inside <Admin> where usePermissions is safe to call)
        <Resource
          name="tenants"
          key="tenants"
          list={TenantList}
          edit={canEdit ? TenantEdit : undefined}
          create={canEdit ? TenantCreate : undefined}
          icon={Business}
          options={{ label: "Tenants" }}
        />,
        <CustomRoutes key="custom-routes">
          <Route path="/assets/map" element={<AssetMapPage />} />
          <Route path={`/session_map/:sessionId`} element={<SessionMap />} />
          <Route path="/team" element={<TeamMembersPage />} />
          <Route path="/settings" element={<TenantSettingsPage />} />
        </CustomRoutes>,
      ]}
    />
  );
}
export const BaseApp = App;

export default App;

const resourceKeys = [
  "assets", "timedassets", "uigroups", "audiotracks", "speakers",
  "envelopes", "events", "listenevents", "sessions", "tags",
  "tagcategories", "languages", "localizedstrings", "users", "notifications",
];

function buildResourceLookup(canEdit: boolean): { [index: string]: React.ReactNode } {
  const e = canEdit; // shorthand for conditional edit/create props
  return {
    assets: (
      <Resource name="assets" key="assets" list={AssetList}
        create={e ? AssetCreate : undefined} edit={e ? AssetEdit : undefined}
        options={{ label: "Assets" }} icon={WebAsset} />
    ),
    timedassets: (
      <Resource name="timedassets" key="timedassets" list={TimedAssetList}
        edit={e ? TimedAssetEdit : undefined} create={e ? TimedAssetCreate : undefined}
        icon={WebAsset} options={{ label: "Timed Assets" }} />
    ),
    uigroups: (
      <Resource name="uigroups" key="uigroups" list={UiGroupList}
        edit={e ? UiGroupEdit : undefined} create={e ? UiGroupCreate : undefined}
        icon={Build} options={{ label: "Build UI" }} />
    ),
    audiotracks: (
      <Resource name="audiotracks" key="audiotracks" list={AudioTrackList}
        edit={e ? AudioTrackEdit : undefined} create={e ? AudioTrackCreate : undefined}
        icon={Audiotrack} options={{ label: "Audio Tracks" }} />
    ),
    speakers: (
      <Resource name="speakers" key="speakers" list={SpeakerList}
        edit={e ? SpeakerEdit : undefined} create={e ? SpeakerCreate : undefined}
        icon={Speaker} />
    ),
    envelopes: (
      <Resource name="envelopes" key="envelopes" list={EnvelopeList}
        edit={e ? EnvelopeEdit : undefined} create={e ? EnvelopeCreate : undefined}
        icon={Email} />
    ),
    events: (
      <Resource name="events" key="events" list={EventsList}
        edit={e ? EventsEdit : undefined} create={e ? EventsCreate : undefined}
        icon={Event} />
    ),
    listenevents: (
      <Resource name="listenevents" key="listenevents" list={ListenEventsList}
        edit={e ? ListenEventsEdit : undefined} create={e ? ListenEventsCreate : undefined}
        icon={Hearing} options={{ label: "Listen Events" }} />
    ),
    sessions: (
      <Resource name="sessions" key="sessions" list={SessionList}
        edit={e ? SessionEdit : undefined} create={e ? SessionCreate : undefined}
        icon={AccessTime} />
    ),
    tags: (
      <Resource name="tags" key="tags" list={TagList}
        edit={e ? TagEdit : undefined} create={e ? TagCreate : undefined}
        icon={TagFaces} />
    ),
    tagcategories: (
      <Resource name="tagcategories" key="tagcategories"
        options={{ label: "Tag Categories" }} list={TagCategoryList}
        edit={e ? TagCategoryEdit : undefined} create={e ? TagCategoryCreate : undefined}
        icon={Label} />
    ),
    languages: (
      <Resource name="languages" key="languages" list={LanguageList}
        edit={e ? LanguageEdit : undefined} create={e ? LanguageCreate : undefined}
        icon={Language} />
    ),
    localizedstrings: (
      <Resource name="localizedstrings" key="localizedstrings"
        options={{ label: "Localized Strings" }} list={LocalizedStringList}
        edit={e ? LocalizedStringEdit : undefined} create={e ? LocalizedStringCreate : undefined}
        icon={Translate} />
    ),
    users: (
      <Resource name="users" key="users" list={UserList}
        edit={e ? UserEdit : undefined} create={e ? UserCreate : undefined}
        icon={PeopleAlt} />
    ),
    notifications: (
      <Resource name="notifications" key="notifications" list={NotificationList}
        edit={e ? NotificationEdit : undefined} create={e ? NotificationCreate : undefined}
        icon={Notifications} options={{ label: "Notifications" }} />
    ),
  };
}

export const ResourceList = [
  `projects`,
  ...(import.meta.env.VITE_INCLUDE_TABS === "all"
    ? resourceKeys
    : import.meta.env.VITE_INCLUDE_TABS?.split(`,`)?.filter((r: string) =>
        resourceKeys.includes(r)
      ) || []),
];
