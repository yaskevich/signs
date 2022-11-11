interface keyable {
  [key: string]: any;
}

interface IStats {
  annotations: number;
  annotated: number;
  photos: number;
  messages: { all: number; images: number; dups: number };
  features: Array<string>;
  tree: keyable;
}

interface IFeature {
  id?: number;
  code: string;
  value?: boolean | string | number;
  title: string;
  note?: string;
  parent: number;
  type: string | null;
  comment: string;
  children?: Array<IFeature>;
  ref?: IFeature;
  checked?: boolean;
}

interface IAnnotation {
  id: string;
  type: string;
  content: string;
  tg_id?: number;
  orient: number;
  country: string;
  properties: Array<IFeature>;
  features: Array<IFeature>;
}

interface IMessage {
  id: number;
  tg_id: number;
  orient: number;
  country: string;
  next?: number;
  prev?: number;
  url: string;
  src: string;
  created: string;
  imagepath: string;
  annotated: string;
  features: Array<IFeature>;
  data: {
    message: string;
    grouped_id: string;
    from_id: { user_id: string };
    fwd_from: { from_id: { channel_id: number }; channel_post: string; date: string; user_id: string };
    date: string;
    views: string;
    _: string;
  };
}

interface IUser {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  email: string;
  sex: number;
  server: string;
  commit: string;
  unix: number;
  privs: number;
  activated: boolean;
  requested: Date;
  text_id: number;
  token?: string;
}

interface IUsersDict {
  [id: string]: IUser;
}

interface IObject {
  id: number;
  data_id: number;
  content: string;
  tg_id?: number;
  properties: Array<IFeature>;
  features: Array<IFeature>;
  geometry: string;
  shape: string;
  renderedvia: Object;
  image?: string;
}

interface IState {
  token?: string;
  error?: string;
  user?: IUser;
  selection: {
    photos: keyable;
    objects: keyable;
  };
}

interface ISettings {
  registration_open: boolean;
}
