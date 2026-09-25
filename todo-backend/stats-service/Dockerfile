FROM node:24-alpine

ENV NODE_ENV=production
WORKDIR /app

COPY package*.json ./
# Uses "install" not "ci": this project has no package-lock.json yet
# (nothing here needed one — see the note in DEPLOY.md). "npm install"
# works without a lock file; it also writes one on first run.
RUN npm install --omit=dev

COPY . .

# "node" is a normal (non-root) user that already exists in the node image
USER node

EXPOSE 5000
CMD ["node", "src/server.js"]
