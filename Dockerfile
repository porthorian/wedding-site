FROM node:25.5-alpine AS builder
WORKDIR /app

# Use Corepack to ensure yarn is available in CI-friendly Node images
#RUN corepack enable && corepack prepare yarn@stable --activate

# Install dependencies (use frozen lockfile if you have yarn.lock)
COPY package.json yarn.lock .yarnrc.yml ./

# Install all dependencies (including dev) so native modules can build
RUN yarn install --immutable || (echo "YARN INSTALL FAILED - dumping yarn install log(s) if present" && \
 for f in /tmp/xfs-*/*/build.log /tmp/xfs-*/build.log; do [ -f "$f" ] && (echo "--- $f ---" && sed -n '1,200p' "$f"); done; false)

# Copy source and build
COPY . .

# If build fails, attempt to show Yarn build logs from the ephemeral tmp dir
RUN yarn build || (echo "BUILD FAILED - dumping yarn build.log(s) if present" && \
 for f in /tmp/xfs-*/*/build.log /tmp/xfs-*/build.log; do [ -f "$f" ] && (echo "--- $f ---" && sed -n '1,200p' "$f"); done; false)

FROM node:25.5-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Copy build output and node_modules from builder
COPY --from=builder /app/.output ./.output
COPY --from=builder /app/node_modules ./node_modules

EXPOSE ${PORT}

CMD ["node", ".output/server/index.mjs"]
