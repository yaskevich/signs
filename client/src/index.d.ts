interface keyable {
    [key: string]: any,
}

interface IStats {
    annotations: number,
    messages: number,
    photos: number,
    orientation: Array<Array<number>>,
    languages: Array<string>,
    features: Array<string>,
    scheme: {
        languages: Array<string>,
        features: Array<string>,
        orientation: keyable,
    },
}

interface IAnnotation {
    id: string,
    type: string,
    body: Array<{
        "type": string,
        "value": string,
        "purpose": string,
    }>,
}

interface IMessage {
    tg_id: number,
    orient: number,
    country: string,
    next?: number,
    prev?: number,
    url: string,
    src: string,
    created: string,
    imagepath: string,
    annotations: Array<IAnnotation>,
    data: { message: string, grouped_id: string, from_id: {user_id: string}, fwd_from: { from_id: { channel_id: number }, channel_post: string, date: string, user_id: string }, date: string, views: string, "_": string, },
}

interface IUser {
    id: number,
    username: string | null,
    firstname: string | null,
    lastname: string | null,
    tg_id: number,
}

interface IUsersDict {
    [id: string]: IUser,
}
