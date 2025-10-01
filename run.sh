#!/bin/bash

# Starting the go server
cd server
go run cmd/main.go &

# Starting the react frontend
cd ../client
npm run dev
