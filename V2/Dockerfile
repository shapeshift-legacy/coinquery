# Build stage
FROM golang:1.12-alpine as builder
RUN apk --update add git gcc libc-dev zeromq-dev

COPY . /V2

WORKDIR /V2/cmd/api
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /go/bin/api

WORKDIR /V2/cmd/indexer
RUN CGO_ENABLED=1 GOOS=linux GOARCH=amd64 go build -a -o /go/bin/indexer

WORKDIR /V2/cmd/monitor
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /go/bin/monitor

WORKDIR /V2/cmd/txvalidator
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /go/bin/txvalidator

WORKDIR /V2/cmd/blockvalidator
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /go/bin/blockvalidator

# Run stage
FROM alpine

# Add sops so that each container can decrypt secrets at runtime in megacluster
ADD https://github.com/mozilla/sops/releases/download/v3.6.1/sops-v3.6.1.linux /usr/bin/sops
RUN chmod 0755 /usr/bin/sops

COPY --from=builder /V2/config /config

RUN apk update && apk --update add ca-certificates libc-dev zeromq-dev
RUN update-ca-certificates

ARG VERSION
ARG ENVIRONMENT

ENV COIN $COIN
ENV ENVIRONMENT $ENVIRONMENT

# Write the git version into the project for the /info endpoint
RUN echo $VERSION > git-version

COPY --from=builder /go/bin/api /go/bin/api
COPY --from=builder /go/bin/indexer /go/bin/indexer
COPY --from=builder /go/bin/monitor /go/bin/monitor
COPY --from=builder /go/bin/txvalidator /go/bin/txvalidator
COPY --from=builder /go/bin/blockvalidator /go/bin/blockvalidator

EXPOSE 4000
