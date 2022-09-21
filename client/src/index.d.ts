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
  id: number;
  code: string;
  value: boolean | string | number;
  title: string;
  note: string;
  parent: number;
  type: string;
  comment: string;
  children: Array<IFeature>;
  ref?: IFeature;
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
  username: string | null;
  firstname: string | null;
  lastname: string | null;
  tg_id: number;
}

interface IUsersDict {
  [id: string]: IUser;
}
