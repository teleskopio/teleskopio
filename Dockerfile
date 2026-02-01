FROM node:22.14.0-alpine AS frontend
ENV NODE_ENV=production
RUN --mount=type=cache,target=/root/.npm \
    npm install -g pnpm@10.9.0

WORKDIR /usr/src/app

RUN --mount=type=bind,source=frontend/package.json,target=/usr/src/app/package.json \
    --mount=type=bind,source=frontend/pnpm-lock.yaml,target=/usr/src/app/pnpm-lock.yaml \
    --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY frontend .

# Build
RUN pnpm build

FROM golang:1.25.0 AS builder
ARG TARGETOS TARGETARCH APP_VERSION

RUN mkdir -p /app
WORKDIR /app
COPY --from=frontend /usr/src/app/dist  /app/dist

ADD ./go.mod ./go.sum .
RUN go mod download
ADD . /app

RUN GOOS=$TARGETOS GOARCH=$TARGETARCH go build -ldflags "-X main.version=$APP_VERSION" -v -o /build/teleskopio

FROM golang:1.25.0 AS runner

COPY --from=builder /build/teleskopio /usr/bin/teleskopio

EXPOSE 3080
ENTRYPOINT ["/usr/bin/teleskopio"]
