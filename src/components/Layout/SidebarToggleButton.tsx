import MenuIcon from "@mui/icons-material/Menu";
import { IconButton, Tooltip } from "@mui/material";
import * as React from "react";
import { useTranslate } from "react-admin";
import { useToggleSidebar } from "./useToggleSidebar";

/**
 * A button that toggles the sidebar. Used by default in the <AppBar>.
 * @param props The component props
 * @param {String} props.className An optional class name to apply to the button
 */
export const SidebarToggleButton = (props: SidebarToggleButtonProps) => {
  const translate = useTranslate();
  const { className } = props;
  const [open, toggleSidebar] = useToggleSidebar();

  return (
    <Tooltip
      title={translate(open ? "ra.action.close_menu" : "ra.action.open_menu", {
        _: "Open/Close menu",
      })}
      enterDelay={500}
    >
      <IconButton
        color="inherit"
        onClick={() => toggleSidebar(!open)}
        className={className}
        size="large"
      >
        <MenuIcon
          sx={{
            transition: "transform 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
      </IconButton>
    </Tooltip>
  );
};

export type SidebarToggleButtonProps = {
  className?: string;
};
