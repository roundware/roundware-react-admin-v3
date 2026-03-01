import React from "react";
import { Layout, LayoutProps, Sidebar, SidebarProps } from "react-admin";
import { useProjects } from "../../context/ProjectsContext";
import Appbar from "./Appbar";
import { Menu } from "./Menu";

const CustomSidebar = (props: SidebarProps) => {
  const { selectedProject } = useProjects();
  if (!selectedProject) return null;
  return <Sidebar {...props} />;
};

const CustomLayout = (props: LayoutProps): JSX.Element => {
  return (
    <Layout
      {...props}
      // @ts-expect-error React.memo wrapping
      appBar={Appbar}
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      sidebar={CustomSidebar}
      menu={Menu}
    />
  );
};

export default CustomLayout;
