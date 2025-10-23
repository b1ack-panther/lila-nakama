FROM heroiclabs/nakama-pluginbuilder:3.26.0 AS builder

ENV GO111MODULE on
ENV CGO_ENABLED 1
ENV GOPRIVATE "github.com/heroiclabs/nakama-project-template"

WORKDIR /backend
COPY . .

RUN go build --trimpath --mod=vendor --buildmode=plugin -o ./backend.so

FROM heroiclabs/nakama:3.26.0

COPY --from=builder /backend/backend.so /nakama/data/modules
COPY --from=builder /backend/local.yml /nakama/data/


# FROM heroiclabs/nakama-pluginbuilder:3.26.0 AS builder

# ENV GO111MODULE on
# ENV CGO_ENABLED 1
# ENV GOPRIVATE "github.com/heroiclabs/nakama-project-template"

# WORKDIR /backend
# COPY . .

# RUN go build --trimpath --mod=vendor --buildmode=plugin -o ./backend.so

# FROM heroiclabs/nakama:3.26.0

# COPY --from=builder /backend/backend.so /nakama/data/modules
# COPY --from=builder /backend/local.yml /nakama/data/

# # Nakama listens on 7350, expose it
# EXPOSE 7350

# # Entrypoint for Cloud Run
# CMD ["nakama", "serve", "--config", "/nakama/data/local.yml"]