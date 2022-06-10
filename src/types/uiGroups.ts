import { LocalizedString } from "types";

export interface IUIGroup {
  id: number;
  name: string;
  ui_mode: "listen" | "speak" | "browse";
  select: "single" | "multi" | "min_one";
  active: boolean;
  index: number;
  header_text_loc: string;
  header_text_loc_admin: LocalizedString[];
  tag_category_id: number;
  project_id: number;
  ui_items: IUIItems[];
}

export interface IUIItems {
  id: number;
  index: number;
  default: boolean;
  active: boolean;
  ui_group_id: number;
  tag_id: number;
  parent_id: null | number;
}

export interface UiItemNode extends IUIItems {
  displayText: string;

  children?: UiItemNode[];
}
