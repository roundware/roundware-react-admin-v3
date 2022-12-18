import { stringify } from "query-string";
import {
    Identifier,
    fetchUtils,
    DataProvider,
    GetListResult,
    GetManyReferenceParams,
    GetManyReferenceResult,
    CreateParams,
    CreateResult,
    DeleteManyParams,
    DeleteManyResult,
    DeleteParams,
    DeleteResult,
    GetManyParams,
    GetManyResult,
    GetOneParams,
    GetOneResult,
    UpdateManyParams,
    UpdateManyResult,
    UpdateParams,
    UpdateResult,
    FilterPayload,
    SortPayload,
    PaginationPayload,
    GetListParams,
    RaRecord,
} from "ra-core";
import { XMLHttpRequestWithAuthToken } from "./tokenAuthProvider";

export {
    default as tokenAuthProvider,
    fetchJsonWithAuthToken,
} from "./tokenAuthProvider";

const getPaginationQuery = (pagination: PaginationPayload) => {
    if (pagination.page === 0) return {};
    return {
        page: pagination.page,
        page_size: pagination.perPage,
        paginate: true,
    };
};

const getFilterQuery = (filter: FilterPayload) => {
    const { q: search, ...otherSearchParams } = filter;
    return {
        ...otherSearchParams,
        search,
    };
};

export const getOrderingQuery = (sort: SortPayload) => {
    const { field, order } = sort;
    return {
        ordering: `${order === "ASC" ? "" : "-"}${field}`,
    };
};

/**
 *
 *
 * @export
 * @class RoundwareDataProvider
 * @implements {DataProvider}
 */
export class RoundwareDataProvider implements DataProvider {
    apiUrl: string;
    httpClient: typeof fetchUtils.fetchJson;
    paginateAllByDefault: boolean;

    cachedProjectData = new Map<number, Map<string, RaRecord[]>>();
    currentProjectId = 0;

    revalidatingResources: string[] = [];

    constructor(
        apiUrl: string,
        httpClient = fetchUtils.fetchJson,
        paginateAllByDefault = false
    ) {
        this.apiUrl = apiUrl;
        this.httpClient = httpClient;
        this.paginateAllByDefault = paginateAllByDefault;
    }

    getResource(resource: string, projectId: number = this.currentProjectId) {
        const resources = this.cachedProjectData.get(projectId);

        if (!resources) return;
        return resources.get(resource);
    }

    setResourse(
        resource: string,
        data: RaRecord[],
        projectId: number = this.currentProjectId
    ) {
        // don't cache projects
        if ([`projects`].includes(resource)) return;
        let resources = this.cachedProjectData.get(projectId);
        if (!resources) resources = new Map<string, RaRecord[]>();
        resources.set(resource, data);
        this.cachedProjectData.set(projectId, resources);
    }

    /**
     *
     */
    async getList<RecordType extends RaRecord = RaRecord>(
        resource: string,
        params: GetListParams,
        /** revalidates cache */
        revalidate = false
    ): Promise<GetListResult<RecordType>> {
        const { project_id, session_id, ...filters } = params.filter;
        console.debug(`getList`);

        /** get url query */
        const query = {
            ...getFilterQuery({
                project_id: project_id || this.currentProjectId,
                session_id,
                admin: 1,
                // other filters;
                ...filters,
            }),
            ...getOrderingQuery(params.sort),
            // ...(paginate && getPaginationQuery(params.pagination)),
        };

        /** generate url */
        const url = `${this.apiUrl}/${resource}/?${stringify(query)}`;

        /** data to be returned */
        let json: RaRecord[] = [];

        /** get resource from cached for that partifular project & sort by id */
        const getFromCache = () => {
            json = [
                ...(this.getResource(resource, params.filter.project_id) || []),
            ].sort((a, b) => (a.id > b.id ? 1 : -1));
        };

        const getFromNetwork = async () => {
            /** add to revalidaitng resources array
             *  to avoid getting from network again if already happening
             */
            this.revalidatingResources.push(resource);
            /** get with query params for now to send response quickly, but we will fetch again without any filters  after this */
            ({ json } = await this.httpClient(url));
            json = this.normalizeApiResponse(json);

            /** filter events by project_id client side */
            if (resource == "events") {
                const sessions = this.getResource("sessions");
                console.debug(`filtering events by session`);
                json = json.filter((e) =>
                    sessions?.some((s) => s.id == e.session_id)
                );
            }

            /** save in cache */
            this.setResourse(resource, json, params.filter.project_id);

            /** remove frmo revalidating resources */
            this.revalidatingResources = this.revalidatingResources.filter(
                (r) => r !== resource
            );
            // above code we might have fetched with filter;
            // below code we fetch without filter and save it;
            // should happen async
            if (Object.values(params.filter).length > 0) {
                // get without filter
                const newQuery = {
                    ...getFilterQuery({
                        project_id:
                            params.filter.project_id || this.currentProjectId,
                        session_id: params.filter.session_id,
                        admin: 1,
                        // not other filters;
                    }),
                };
                const newUrl = `${this.apiUrl}/${resource}/?${stringify(
                    newQuery
                )}`;

                this.httpClient(newUrl).then(
                    ({ json: newJson }: { json: RaRecord[] }) => {
                        const normalizedJson =
                            this.normalizeApiResponse(newJson);
                        // save in cache
                        this.setResourse(
                            resource,
                            normalizedJson,
                            params.filter.project_id
                        );
                    }
                );
            }
        };

        /** if revalidate passed and not already revalidating */
        if (revalidate && !this.revalidatingResources.includes(resource)) {
            await getFromNetwork();
        } else if (
            /** if available in cache */
            this.getResource(resource, params.filter.project_id)?.length
        ) {
            getFromCache();
            /** cache not available get from network */
        } else {
            await getFromNetwork();
        }

        /** resources from cache not filtered, do filtering client side */
        if (Object.keys(filters).length > 0) {
            Object.keys(filters).forEach((filter) => {
                const start_time_key =
                    resource == `sessions` ? `starttime` : `start_time`;
                switch (filter) {
                    case `start_time__gte`:
                        json = json.filter(
                            (d) =>
                                new Date(d[start_time_key]) >=
                                new Date(filters[filter])
                        );
                        break;
                    case `start_time__lte`:
                        json = json.filter(
                            (d) =>
                                new Date(d[start_time_key]) <=
                                new Date(filters[filter])
                        );
                        break;
                    case `created__gte`:
                        json = json.filter(
                            (d) =>
                                new Date(d.created) >= new Date(filters[filter])
                        );
                        break;
                    case `created__lte`:
                        json = json.filter(
                            (d) =>
                                new Date(d.created) <= new Date(filters[filter])
                        );
                        break;
                    case `tag_ids`:
                        console.debug(filters[filter]);
                        json = json.filter((d) =>
                            filters[filter].every((t: number) =>
                                d.tag_ids.includes(t)
                            )
                        );
                        break;
                    default:
                        if (filter.slice(-5) == "__gte") {
                            json = json.filter((d) => {
                                const res =
                                    d[filter.slice(0, -5)] >= filters[filter];

                                return res;
                            });
                            console.debug(`res`, json);
                        } else if (filter.slice(-5) == "__lte") {
                            json = json.filter(
                                (d) => d[filter.slice(0, -5)] <= filters[filter]
                            );
                        } else {
                            json = json.filter(
                                (d) => d[filter] == filters[filter]
                            );
                        }
                        break;
                }
            });
        }

        /** do sorting client side, resources from cache can't be sorted */
        if (params?.sort?.field) {
            const { field, order } = params.sort;
            json = json.sort((a, b) => {
                let bool = false;
                if (order == "ASC") {
                    a[field] > b[field] ? (bool = true) : (bool = false);
                } else a[field] > b[field] ? (bool = false) : (bool = true);
                if (bool) return 1;
                return -1;
            });
        }

        /** do pagination client side, resources from cache can't be paginated */
        const total = json.length;
        const { page, perPage } = params.pagination;

        /** if page 0 and perPage 0 then understand that client doesn't want pagination */
        if (page > 0 && perPage > 0) {
            const start = page * perPage - perPage;
            const end = start + perPage;
            json = json.slice(start, end);
        }

        return {
            data: json as RecordType[],
            total: total,
        };
    }

    normalizeApiResponse(data: RaRecord[] | { results: RaRecord[] }) {
        return Array.isArray(data) ? data : data.results;
    }

    /** returns from cache if available else does new network req */
    async getOne<RecordType extends RaRecord>(
        resource: string,
        { id, ...query }: GetOneParams
    ): Promise<GetOneResult<RecordType>> {
        const data = await this.getOneJson(resource, id, query);
        if (!data) throw new Error(`Not Found`);
        return {
            data,
        } as {
            data: RecordType;
        };
    }

    async getMany<RecordType extends RaRecord>(
        resource: string,
        params: GetManyParams
    ): Promise<GetManyResult<RecordType>> {
        console.debug(`getMany`, resource);
        return Promise.all(
            params.ids.map((id) => this.getOneJson(resource, id))
        ).then((data) => ({ data })) as Promise<GetManyResult<RecordType>>;
    }

    async getManyReference<RecordType extends RaRecord>(
        resource: string,
        params: GetManyReferenceParams,
        paginate = false
    ): Promise<GetManyReferenceResult<RecordType>> {
        console.debug(`getManyReferene`, resource);
        const query = {
            ...getFilterQuery(params.filter),
            ...(paginate && getPaginationQuery(params.pagination)),
            ...getOrderingQuery(params.sort),
            [params.target]: params.id,
        };

        const url = `${this.apiUrl}/${resource}/?${stringify(query)}`;

        const { json } = await this.httpClient(url);
        return {
            data: paginate ? json.results : json,
            total: paginate ? json.count : json?.length,
        };
    }

    async update<RecordType extends RaRecord>(
        resource: string,
        params: UpdateParams
    ): Promise<UpdateResult<RecordType>> {
        console.debug(`update`, resource);

        /** determine if any of the field has File type of data
         *  in that case we need to send form-data req
         */
        const needsFormData = Object.values(params?.data)?.some(
            (v) => v instanceof File || v instanceof Blob
        );

        /** generate form data type of object */
        if (needsFormData) {
            params.data = this.getFormData(params.data as RaRecord);
        }

        const client = needsFormData
            ? XMLHttpRequestWithAuthToken
            : this.httpClient;
        /** dynamiclly remove application/json header in case of formdata */
        await client(
            `${this.apiUrl}/${resource}/${params.id}/`,
            {
                method: "PATCH",
                body:
                    params.data instanceof FormData
                        ? params.data
                        : JSON.stringify(params.data),
                ...(needsFormData && {
                    headers: new Headers({}),
                }),
            },
            params?.meta?.onProgress
        );

        /** make new request for latest object */
        const newData = await this.getOneJson(
            resource,
            params.id,
            {
                admin: 1,
            },
            true
        );

        /** discard previous record from cache */
        const newList = this.getResource(
            resource,
            this.currentProjectId
        )?.filter((r) => r.id != params.id);

        /** push newly fetched record to cache */
        if (Array.isArray(newList)) {
            newList.push(newData as RaRecord);
            this.setResourse(resource, newList, this.currentProjectId);
        } else {
            /** list not available yet then do a new req */
            this.getList(
                resource,
                {
                    filter: {},
                    sort: {
                        field: "id",
                        order: "ASC",
                    },
                    pagination: {
                        page: 0,
                        perPage: 0,
                    },
                },
                true
            );
        }
        return { data: newData } as {
            data: RecordType;
        };
    }

    async updateMany(
        resource: string,
        params: UpdateManyParams
    ): Promise<UpdateManyResult> {
        return Promise.all(
            params.ids.map((id) =>
                this.httpClient(`${this.apiUrl}/${resource}/${id}/`, {
                    method: "PATCH",
                    body: JSON.stringify(params.data),
                })
            )
        ).then((responses) => ({
            data: responses.map(({ json }) => json.id),
        }));
    }
    async create<RecordType extends RaRecord>(
        resource: string,
        params: CreateParams
    ): Promise<CreateResult<RecordType>> {
        params.data.project_id = this.currentProjectId;
        const needsFormData = Object.values(params?.data)?.some(
            (v) => v instanceof File || v instanceof Blob
        );
        if (needsFormData) {
            params.data = this.getFormData(params.data);
        }
        const client = needsFormData
            ? XMLHttpRequestWithAuthToken
            : this.httpClient;
        const result = await client(
            `${this.apiUrl}/${resource}/`,
            {
                method: "POST",
                body:
                    params.data instanceof FormData
                        ? params.data
                        : JSON.stringify(params.data),
                ...(needsFormData && {
                    headers: new Headers({}),
                }),
            },
            params?.meta?.onProgress
        );
        const json = result.json;

        /** make new request for latest object with admin params */
        const newData = await this.getOneJson(
            resource,
            json.id,
            {
                admin: 1,
            },
            true
        );

        const cachedList = this.getResource(resource, this.currentProjectId);

        /** push newly fetched record to cache */
        if (Array.isArray(cachedList)) {
            cachedList.push(newData as RaRecord);
            this.setResourse(resource, cachedList, this.currentProjectId);
        } else {
            /** list not available yet then do a new req */
            this.getList(
                resource,
                {
                    filter: {},
                    sort: {
                        field: "id",
                        order: "ASC",
                    },
                    pagination: {
                        page: 0,
                        perPage: 0,
                    },
                },
                true
            );
        }
        return {
            data: { ...json },
        };
    }
    async delete<RecordType extends RaRecord>(
        resource: string,
        params: DeleteParams
    ): Promise<DeleteResult<RecordType>> {
        return this.httpClient(`${this.apiUrl}/${resource}/${params.id}/`, {
            method: "DELETE",
        }).then(() => {
            let list = this.getResource(resource, this.currentProjectId);
            list = list?.filter((r) => r.id != params.id);
            this.setResourse(resource, list || [], this.currentProjectId);
            return { data: params.previousData };
        });
    }
    async deleteMany(
        resource: string,
        params: DeleteManyParams
    ): Promise<DeleteManyResult> {
        return Promise.all(
            params.ids.map((id) =>
                this.httpClient(`${this.apiUrl}/${resource}/${id}/`, {
                    method: "DELETE",
                })
            )
        ).then((responses) => {
            let list = this.getResource(resource);
            if (Array.isArray(list)) {
                list = list?.filter((r) => params.ids.includes(r.id));
                this.setResourse(resource, list || [], this.currentProjectId);
            }
            return { data: responses.map(({ json }) => json.id) };
        });
    }

    getOneJson = async (
        resource: string,
        id: Identifier,
        filterQuery: FilterPayload = {},
        revalidate = false
    ): Promise<RaRecord | undefined> => {
        // always revalidate for these resources
        if ([`projects`].includes(resource)) {
            revalidate = true;
        }

        // check if resource is already in cache
        // if yes then return it
        if (
            !revalidate &&
            this.getResource(resource)?.some((d) => d.id == id)
        ) {
            return this.getResource(resource)?.find((d) => d.id == id);
        }

        //  not in cache; fetch it;

        // resources which require session_id
        if ([`projects`].includes(resource)) {
            filterQuery = {
                ...filterQuery,
                session_id: 1,
                admin: 1,
            };
        }

        // fetch results
        const results: RaRecord = await this.httpClient(
            `${this.apiUrl}/${resource}/${id}/?${stringify(
                getFilterQuery(filterQuery)
            )}`
        ).then((response) => response.json);

        // save in cache;

        let resourceArray = this.getResource(resource, this.currentProjectId);

        if (!resourceArray?.length) {
            this.getList(
                resource,
                {
                    filter: {},
                    pagination: {
                        page: 0,
                        perPage: 0,
                    },
                    sort: {
                        field: "id",
                        order: "ASC",
                    },
                },
                true
            );
        } else {
            // remove old copy from cache;
            resourceArray = resourceArray.filter((r) => r.id != results.id);
            // save latest copy in cache;
            resourceArray.push(results);
            // sort by id
            resourceArray.sort((a, b) => (a.id > b.id ? 1 : -1));
            // save in cache;
            this.setResourse(resource, resourceArray, this.currentProjectId);
        }

        return results;
    };

    getFormData(object: RaRecord) {
        return this.objectToFormData(object);
    }

    objectToFormData(
        obj: Record<string, unknown>,
        rootName?: string,
        ignoreList?: string[]
    ) {
        const formData = new FormData();

        function appendFormData(
            data: Record<string, unknown> | string | unknown | File | Blob,
            root = ""
        ) {
            if (!ignore(root)) {
                root = root || "";
                if (data instanceof File) {
                    formData.append(root, data);
                } else if (Array.isArray(data)) {
                    for (let i = 0; i < data.length; i++) {
                        appendFormData(data[i] + ",", root);
                    }
                } else if (typeof data === "object" && data) {
                    for (const key in data) {
                        // eslint-disable-next-line no-prototype-builtins
                        if (data.hasOwnProperty(key)) {
                            if (root === "") {
                                appendFormData(
                                    (data as Record<string, unknown>)[key],
                                    key
                                );
                            } else {
                                appendFormData(
                                    (data as Record<string, unknown>)[key],
                                    root + "." + key
                                );
                            }
                        }
                    }
                } else {
                    if (data !== null && typeof data !== "undefined") {
                        formData.append(root, data as string);
                    }
                }
            }
        }

        function ignore(root: string) {
            return (
                Array.isArray(ignoreList) &&
                ignoreList.some(function (x) {
                    return x === root;
                })
            );
        }

        appendFormData(obj, rootName);

        return formData;
    }
}
