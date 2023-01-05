import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';
import { useUserStore } from 'stores/user-store';

// Describes a server received bad request error; timestamps are ignored.
export class BadRequestError {
  constructor(public Message: string, public Timestamp: Date) {}
}

// Describes a server received internal server error; timestamps are ignored.
export class InternalServerError {
  constructor(public Error: string, public Timestamp: Date) {}
}

// Describes a server received not found error.
export class NotFoundError {}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

export const baseUrl = <string>process.env.baseUrl;

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({
  baseURL: baseUrl,
  // withCredentials: true,
});
// tk export base url
api.interceptors.request.use(
  function (config) {
    const us = useUserStore();
    if (us.user) {
      config.headers.Authorization = `Bearer ${us.user.Id}`;
    }
    return config;
  },
  function (error) {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  function (response) {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  function (error) {
    // status codes outside the range of 2xx are caught here
    switch (error.response?.status) {
      case 401:
        useUserStore().SignOut();
        return Promise.reject(error);
      // wrap 400 errors with a custom class for easier handling down the line
      case 400:
        return Promise.reject(
          new BadRequestError(
            error.response.data.Message,
            error.response.data.Timestamp
          )
        );
      case 404:
        return Promise.reject(new NotFoundError());
      case 500:
        return Promise.reject(
          new InternalServerError(
            error.response.data.Error,
            error.response.data.Timestamp
          )
        );
      default:
        return Promise.reject(error);
    }
  }
);

export default boot(({ app }) => {
  // for use inside Vue files (Options API) through this.$axios and this.$api

  app.config.globalProperties.$axios = axios;
  // ^ ^ ^ this will allow you to use this.$axios (for Vue Options API form)
  //       so you won't necessarily have to import axios in each vue file

  app.config.globalProperties.$api = api;
  // ^ ^ ^ this will allow you to use this.$api (for Vue Options API form)
  //       so you can easily perform requests against your app's API
});

export { api };
