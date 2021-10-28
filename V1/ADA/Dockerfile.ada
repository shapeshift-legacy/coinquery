FROM cardano-container-mainnet-explorer:latest

# for syncing blockchain
RUN mkdir wallet

# expose cardano node ports
EXPOSE 8100 8090 8000

ARG COMMIT
ENV COMMIT ${COMMIT:-undefined}

CMD ["/bin/cardano-start"]