export type ISession = {
  id: number;
  device_id: null | string;
  starttime: string;
  stoptime: null | string;
  client_type: null | string;
  client_system: string;
  demo_stream_enabled: boolean;
  geo_listen_enabled: boolean;
  timezone: string;
  project_id: number;
  language_id: number;
};
