FROM node:24-alpine

WORKDIR /backend

RUN adduser -D bhushan
RUN chown -R bhushan:bhushan /backend

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=bhushan:bhushan . .

USER bhushan

ENV NODE_ENV=production
EXPOSE 4000
STOPSIGNAL SIGTERM
CMD ["npm", "start"]