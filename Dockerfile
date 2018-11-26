# Stage 0, "build-stage", based on Node.js, to build and compile the frontend
FROM node:10 as build-stage

WORKDIR /app

COPY package*.json /app/

RUN npm install

COPY ./ /app/

RUN npm run build

# Stage 1, based on Nginx, to have only the compiled app, ready for production with Nginx
FROM nginx:1.15

ADD bin/nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=build-stage /app/prod/ /usr/share/nginx/html
