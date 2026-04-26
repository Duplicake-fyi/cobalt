FROM node:24-alpine AS base
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

FROM base AS build
WORKDIR /app
COPY . /app

RUN corepack enable
RUN apk add --no-cache python3 alpine-sdk

RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm deploy --filter=@imput/cobalt-api --prod /prod/api

ARG WEB_DEFAULT_API=http://localhost:2841/
ENV WEB_DEFAULT_API=$WEB_DEFAULT_API
RUN pnpm run --prefix web check || true
RUN pnpm run --prefix web build

FROM node:24-alpine AS api
WORKDIR /app

COPY --from=build --chown=node:node /prod/api /app
COPY --from=build --chown=node:node /app/.git /app/.git

USER node

EXPOSE 9000
CMD [ "node", "src/cobalt" ]

FROM nginx:alpine AS web
COPY --from=build /app/web/build /usr/share/nginx/html
COPY nginx-web.conf /etc/nginx/conf.d/default.conf
EXPOSE 80

FROM node:24-alpine AS combined
RUN apk add --no-cache nginx

WORKDIR /app

COPY --from=build --chown=node:node /prod/api /app
COPY --from=build --chown=node:node /app/.git /app/.git
COPY --from=build /app/web/build /var/www/html
COPY nginx.conf /etc/nginx/nginx.conf
COPY start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 2841
CMD [ "/start.sh" ]
