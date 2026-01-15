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

echo "⬇️ Downloading Pandoc..."
# Create bin directory
mkdir -p dist/bin

# Download Pandoc (Linux AMD64 for Vercel)
curl -L -o pandoc.tar.gz https://github.com/jgm/pandoc/releases/download/3.1.11.1/pandoc-3.1.11.1-linux-amd64.tar.gz

# Extract
tar -xzf pandoc.tar.gz

# Move binary to dist/bin
cp pandoc-3.1.11.1/bin/pandoc dist/bin/pandoc

# Make executable
chmod +x dist/bin/pandoc

# Cleanup
rm -rf pandoc.tar.gz pandoc-3.1.11.1

echo "✅ Build completed!"
