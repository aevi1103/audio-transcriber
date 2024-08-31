#!/bin/bash

git pull main

npm i

# Build the Next.js application
npm run build

# Start the Next.js application
npm start -p 4000
