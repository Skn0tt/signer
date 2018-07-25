FROM node:9

WORKDIR /app

COPY yarn.lock package.json ./
RUN yarn install

COPY tsconfig.json ./
COPY src/ src/

EXPOSE 80

CMD yarn start
