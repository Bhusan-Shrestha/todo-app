FROM node:24-alpine

WORKDIR /backend

RUN adduser -D bhushan
RUN chown -R bhushan:bhushan /backend

COPY package*.json ./
RUN npm ci

COPY --chown=bhushan:bhushan . .

USER bhushan

EXPOSE 4000
CMD ["npm", "start"]