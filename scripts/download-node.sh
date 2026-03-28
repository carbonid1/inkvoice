#!/bin/bash
set -e

# Download a standalone Node.js binary for macOS arm64
# This gets bundled into the Electron app to run the Next.js standalone server

NODE_VERSION="v22.22.0"
ARCH="arm64"
PLATFORM="darwin"

DIST_DIR="dist-node"
TARBALL="node-${NODE_VERSION}-${PLATFORM}-${ARCH}.tar.gz"
URL="https://nodejs.org/dist/${NODE_VERSION}/${TARBALL}"

if [ -f "${DIST_DIR}/bin/node" ]; then
  echo "[download-node] Node binary already exists at ${DIST_DIR}/bin/node"
  ${DIST_DIR}/bin/node --version
  exit 0
fi

echo "[download-node] Downloading Node.js ${NODE_VERSION} (${PLATFORM}-${ARCH})..."
mkdir -p "${DIST_DIR}"

curl -fsSL "${URL}" | tar xz -C "${DIST_DIR}" --strip-components=1

# Only keep the binary — strip headers, docs, npm, etc.
find "${DIST_DIR}" -mindepth 1 -maxdepth 1 ! -name bin -exec rm -rf {} +
find "${DIST_DIR}/bin" -mindepth 1 ! -name node -exec rm -rf {} +

echo "[download-node] Done: ${DIST_DIR}/bin/node"
${DIST_DIR}/bin/node --version
du -sh "${DIST_DIR}/bin/node"
