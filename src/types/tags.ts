import { LocalizedString } from "types";

export interface ITag {
  id: number;
  value: string;
  description: string;
  data: string;
  filter: string;
  location: null;
  project_id: number;
  tag_category_id: number;
  loc_description?: string | null | number[];
  loc_msg?: number[];
  msg_loc: string;
  loc_msg_admin?: LocalizedString[];
  loc_description_admin?: LocalizedString[];

  relationships: {
    id: number;
    tag_id: number;
    parent_id: null;
  }[];
}

export interface ITagCategory {
  id: number;
  name: string;
  data: string;
}
