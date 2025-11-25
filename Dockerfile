FROM node:18-bullseye

# Install FFmpeg
RUN apt-get update && apt-get install -y ffmpeg

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

# Build the project (if needed, or just run ts-node)
# RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
