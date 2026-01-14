#!/bin/sh
# Vercel build script with DATABASE_URL fallback

# Set dummy DATABASE_URL if not exists (for Prisma generate)
if [ -z "$DATABASE_URL" ]; then
  export DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
  echo "⚠️ Using dummy DATABASE_URL for build"
fi

echo "🔧 Running prisma generate..."
npx prisma generate

echo "🏗️ Building NestJS application..."
npx nest build

echo "✅ Build completed!"
