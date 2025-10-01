#!/bin/bash

# Starting the go server
cd server
go run cmd/internal/main.go &

# Starting the react frontend
cd ../client
npm run dev
