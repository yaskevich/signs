import { reactive, ref } from 'vue';
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import project from '../package.json';
import router from './router';

const state = reactive<IState>({
  token: localStorage.getItem('token') || '',
  user: {} as IUser,
  error: '',
  selection: {
    photos: {},
    objects: {},
    mode: false,
  },
});

const getFile = async (route: string, id: string): Promise<any> => {
  if (state.token && id) {
    try {
      const config = {
        headers: { Authorization: 'Bearer ' + state.token },
        responseType: 'blob',
        params: { id: id },
      } as AxiosRequestConfig;

      const response = await axios.get('/api/' + route, config);
      const blob = new Blob([response.data], { type: 'application/gzip' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = id;
      link.click();
      URL.revokeObjectURL(link.href);
    } catch (error) {
      return error;
    }
  }
};

const logoutUser = () => {
  state.token = '';
  state.user = {} as IUser;
  localStorage.removeItem('token');
  // router.replace('/login');
};

const get = async (route: string, id: string | null = '', data: Object = {}): Promise<any> => {
  if (state.token) {
    try {
      // console.log("data", data);
      // console.log("token", state.token);
      const config = state.token ? { headers: { Authorization: 'Bearer ' + state.token }, params: {} } : {};

      let params = id ? { id } : {};
      config.params = { ...params, ...data };

      const response = await axios.get('/api/' + route, config);
      // console.log(response.data);

      return response.data;
    } catch (error: any | AxiosError) {
      console.log('Cannot get', error);
      if (axios.isAxiosError(error)) {
        // console.log("axios error");
        if (error.response?.status === 401) {
          console.log('access denied!');
          logoutUser();
        }
      }
      return error;
    }
  }
  console.log('No key. Fail.');
};

const post = async (table: string, data: Object): Promise<any> => {
  if (state.token) {
    try {
      const config = { headers: { Authorization: 'Bearer ' + state.token } };
      // const config = {};
      // console.log(`POST ${table}`);
      const response = await axios.post('/api/' + table, data, config);
      // console.log("store:response", response.data);
      return response.data;
    } catch (error) {
      console.log('Cannot get', error);
      return error;
    }
  }
  console.log('No token. Fail.');
};

const postUnauthorized = async (table: string, data: Object): Promise<any> => {
  try {
    // console.log(`POST ${table}`);
    const response = await axios.post('/api/' + table, data);
    // console.log('post [NO AUTH]', table, response.data);
    return response;
  } catch (error) {
    console.log('Cannot get', error);
    return error;
  }
};

const getUnauthorized = async (table: string, data?: Object): Promise<any> => {
  try {
    const response = await axios.get('/api/' + table, data);
    // console.log('get [NO AUTH]', table, response.data);
    return response;
  } catch (error) {
    console.log('Cannot get', error);
    return error;
  }
};

const setUser = (data: IUser) => {
  if (data?.token) {
    localStorage.setItem('token', data.token);
    state.token = data.token;
  }
  state.user = { ...state.user, ...data };
};

const getUser = async () => {
  if (state.token) {
    try {
      const config = { headers: { Authorization: 'Bearer ' + state.token } };
      const response = await axios.get('/api/user/info', config);
      // state.user = response.data;
      setUser(response.data);
    } catch (error: any | AxiosError) {
      console.log('Cannot get user', error);
      if (error.response?.status === 401) {
        console.log('access denied!');
        logoutUser();
      }
      return error;
    }
  } else {
    console.log('No token');
  }
};

const deleteById = async (table: string, id: string | number): Promise<any> => {
  if (state.token) {
    try {
      const config = { headers: { Authorization: 'Bearer ' + state.token }, params: {} };
      // if(id) { config["params"] = { id: id }; }
      // console.log("delete query", table, id);
      const response = await axios.delete('/api/' + table + '/' + id, config);
      // console.log(response.data);
      return response.data;
    } catch (error) {
      console.log('Cannot delete', error);
      return error;
    }
  }
  console.log('No token. Fail.');
};

const nest = (items: any, id = 0) =>
  items
    .filter((x: any) => x.parent === id)
    .map((x: any) => {
      const children = nest(items, x.id);
      return { ...x, ...(children?.length && { children }) };
    });

const convertArrayToObject = (arr: any) => Object.assign({}, ...arr.map((x: any) => ({ [x.id]: x })));

export default {
  state,
  getFile,
  get,
  post,
  postUnauthorized,
  getUnauthorized,
  getUser,
  deleteById,
  logoutUser,
  version: project?.version,
  git: 'https' + project?.repository?.url?.slice(3, -4),
  nest,
  setUser,
  convertArrayToObject,
};
