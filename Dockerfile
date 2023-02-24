## create a dev stage
FROM node:19.5-alpine3.16 as dev-stage

# copy the contents of webui into dev-stage; please note the addition of .dockerignore to avoid compat. issues
COPY webui /app/webui
WORKDIR /app/webui

# install Quasar's CLI which facilitates builds
RUN npm i -g @quasar/cli@latest

# install all dependencies, given the lack of node_modules
RUN npm install

# build the SPA with Quasar; the alternative `npm run build` calls quasar's CLI by way of `package.json`
RUN quasar build

## create the final image which hosts the SPA; the `slim` alternative is not recommended
FROM nginx:1.23.3-alpine

# copy the build from the dev stage
COPY --from=dev-stage /app/webui/dist/spa /usr/share/nginx/html
EXPOSE 8080

# execute: docker run --name kvasari-spa -u 1000:1000 -d -p 8080:80 kvasari-spa
