export interface ITag {
    id:number,
      value: string,
      description: string,
      data: string,
      filter: string,
      location: null,
      project_id: number,
      tag_category_id:number,
      description_loc: null,
      msg_loc: string,
      relationships: {
          id: number,
          tag_id:number,
          parent_id: null
        }[]
}

export interface ITagCategory {
    id: number,
    name: string,
    data: string
}