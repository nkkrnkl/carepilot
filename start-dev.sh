#!/bin/bash
# Start the dev server with the correct Node.js version

# Source nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use the Node.js version specified in .nvmrc
nvm use

# Start the dev server
npm run dev

