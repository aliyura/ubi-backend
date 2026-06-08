export interface KoboFarmVerificationPayload {
  _id: number;
  'formhub/uuid': string;
  start: string;
  end: string;
  Farm_Name: string;
  Farm_Id: string;
  /** Space-separated string: "latitude longitude altitude accuracy" */
  latitude_longitude: string;
  Size_Value: string;
  Size_Unit: string;
  Main_Crop_type: string;
  __version__: string;
  'meta/instanceID': string;
  'meta/rootUuid': string;
  _xform_id_string: string;
  _uuid: string;
  _attachments: KoboAttachment[];
  _status: string;
  /** [latitude, longitude] */
  _geolocation: [number, number];
  _submission_time: string;
  _tags: string[];
  _notes: string[];
  _validation_status: Record<string, unknown>;
  _submitted_by: string | null;
}

export interface KoboAttachment {
  id: number;
  uid: string;
  filename: string;
  mimetype: string;
  download_url: string;
  download_large_url: string;
  download_medium_url: string;
  download_small_url: string;
}
