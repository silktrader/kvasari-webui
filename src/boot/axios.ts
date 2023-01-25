import { boot } from 'quasar/wrappers';
import axios, { AxiosInstance } from 'axios';
import { useUserStore } from 'stores/user-store';

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $axios: AxiosInstance;
  }
}

// Describes a server received bad request error; timestamps are ignored.
class BadRequestError {
  constructor(public Message: string, public Timestamp: Date) {}
}

// Describes a server received internal server error; timestamps are ignored.
class InternalServerError {
  constructor(public Error: string, public Timestamp: Date) {}
}

// Describes a server received not found error.
class NotFoundError {}

// Points to the base API URL, as provided in the environment variable, from `quasar.config.js`.
const baseUrl = <string>process.env.baseUrl;

// Constructs a simplistic bearer token from the authenticated user's ID.
const getBearerToken = () => {
  const { user } = useUserStore(); // not reactive
  if (user) return `Bearer ${user.Id}`;
  throw new Error('No authenticated user.');
};

// Creates a global singleton; might create issues with SSR deployments.
const api = axios.create({
  baseURL: baseUrl
  // withCredentials: true,
});

api.interceptors.request.use(
  function(config) {
    config.headers.Authorization = getBearerToken();
    return config;
  },
  function(error) {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  function(response) {
    // status codes within the range of 2xx cause this function to trigger
    return response;
  },
  function(error) {
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

// Helps with (unused) Options API.
export default boot(({ app }) => {
  // needed for `this.$axios` if ever used
  app.config.globalProperties.$axios = axios;

  // needed for `this.$api` if ever used
  app.config.globalProperties.$api = api;
});

export { api, baseUrl, getBearerToken, BadRequestError, InternalServerError, NotFoundError };
