#!/bin/zsh
cd "$(dirname "$0")"
npm install --silent
open http://localhost:3000 &
npm run dev
