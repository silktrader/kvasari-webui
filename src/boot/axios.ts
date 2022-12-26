import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';
import { useAuthStore } from 'stores/auth-store';

export class BadRequestError {
  constructor(public Message: string, public Timestamp: Date) {}
}

export class InternalServerError {
  constructor(public Error: string, public Timestamp: Date) {}
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

// Be careful when using SSR for cross-request state pollution
// due to creating a Singleton instance here;
// If any client changes this (global) instance, it might be a
// good idea to move this instance creation inside the
// "export default () => {}" function below (which runs individually
// for each client)
const api = axios.create({
  baseURL: 'http://localhost:3000',
  // withCredentials: true,
});
// tk export base url
api.interceptors.request.use(
  function (config) {
    const authStore = useAuthStore();
    if (authStore.user) {
      config.headers.Authorization = `Bearer: ${authStore.user.Id}`;
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
        useAuthStore().SignOut();
        return Promise.reject(error);
      // wrap 400 errors with a custom class for easier handling down the line
      case 400:
        return Promise.reject(
          new BadRequestError(
            error.response.data.Message,
            error.response.data.Timestamp
          )
        );
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
