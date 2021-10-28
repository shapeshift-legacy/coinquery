FROM golang:1.12-stretch

ARG AWS_ACCESS_KEY_ID
ARG AWS_SECRET_ACCESS_KEY

ENV AWS_ACCESS_KEY_ID $AWS_ACCESS_KEY_ID
ENV AWS_SECRET_ACCESS_KEY $AWS_SECRET_ACCESS_KEY

RUN go get github.com/cespare/reflex

COPY reflex.conf /

CMD ["reflex", "-c", "/reflex.conf"]
