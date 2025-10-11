# FROM heroiclabs/nakama-pluginbuilder:3.22.0 AS builder

# ENV GO111MODULE on
# ENV CGO_ENABLED 1

# WORKDIR /backend
# COPY . .

# RUN go build --trimpath --buildmode=plugin -o ./backend.so

# FROM heroiclabs/nakama:3.22.0

# COPY --from=builder /backend/backend.so /nakama/data/modules
# COPY --from=builder /backend/local.yml /nakama/data/
# COPY --from=builder /backend/*.json /nakama/data/modules


# Stage 1: build plugin using heroiclabs pluginbuilder
FROM heroiclabs/nakama-pluginbuilder:3.32.0 AS builder
WORKDIR /backend

COPY go.mod go.sum ./
RUN go mod download

COPY ./modules ./modules
RUN mkdir -p /backend/build
# Build the plugin as a .so
RUN go build --trimpath --buildmode=plugin -o /backend/build/main.so ./modules

# Stage 2: final Nakama image with plugin & config
FROM heroiclabs/nakama:3.16.0
LABEL maintainer="you@example.com"

# Copy plugin
COPY --from=builder /backend/build/main.so /nakama/data/modules/main.so

# Copy default config (it references env vars)
COPY ./config/nakama.yml /nakama/data/nakama.yml

# Expose ports (HTTP/GRPC or socket; default nakama ports)
EXPOSE 7350 7351 7349

# Use env-driven config: nakama will pick up /nakama/data/nakama.yml
CMD ["nakama", "--config", "/nakama/data/nakama.yml"]
