import { Toolbar } from "@mui/material";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import ListSubheader from "@mui/material/ListSubheader";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import makeStyles from "@mui/styles/makeStyles";
import React, { useEffect } from "react";
import {
  AppBar,
  Layout,
  AppBarProps,
  LayoutProps,
  Sidebar,
  SidebarProps,
  useRedirect,
  useSidebarState,
} from "react-admin";
import { useProjects } from "../../context/ProjectsContext";
import Appbar from "./Appbar";
import { Menu } from "./Menu";

const useStyles = makeStyles((theme) => ({
  formControl: {
    minWidth: 140,

    borderColor: "rgba(255,255,255,0.8)",
  },
  select: {},
  label: {
    marginRight: 2,
  },
  appBar: {},
  toolbar: {
    flexGrow: 1,
  },
}));

const CustomSidebar = (props: SidebarProps) => {
  const { selectedProject } = useProjects();
  if (!selectedProject) return null;
  return <Sidebar {...props} />;
};

const CustomLayout = (props: LayoutProps): JSX.Element => {
  return (
    <Layout
      {...props}
      appBar={Appbar}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sidebar={CustomSidebar}
      menu={Menu}
    />
  );
};

export default CustomLayout;
