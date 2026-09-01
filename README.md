A Twitter‑style feed and social app built with Next.JS, NextAuth, MongoDB and Tailwind CSS. Developed as part of ReDI School Germany’s Fullstack Development Bootcamp curriculum.

Live Demo: https://mig33.vercel.app/

## 🚀 Features

- **User Authentication** (Email/Password & Google/Github OAuth)
- **Create, Read & List Tweets**
- **Upload Images With Cloudinary or Fetch GIF From Giphy API**
- **Edit (Update) & Delete Own Tweets If Authenticated**
- **Like and Comment Tweets**
- **User Profiles** with their own tweet feeds
- **Theme Switcher** (Dark/Light mode)
- **Responsive UI** using Tailwind CSS
- **Server‑side API routes** in Next.js
- **Database ORM** powered by Mongoose

## 🛠️ Tech Stack

| Layer          | Technology               |
| -------------- | ------------------------ |
| Framework      | Next.js 16 (App Router)  |
| Styling        | Tailwind CSS, Custom CSS |
| Authentication | NextAuth.js              |
| ORM / Database | Mongoose (MongoDB)       |
| Language       | JavaScript               |
| Deployment     | Vercel                   |

## 📦 Installation

1. **Fork & clone** this repo:

   ```bash
   git clone https://github.com/priyoarman/redilink.git
   cd redilink
   ```

2. **Install dependencies**:

   ```bash
   npm install
   # or yarn install
   # or pnpm install
   ```

3. **Environment variables**
   Create a `.env.local` file at the project root and add:

   ```env
   MONGODB_URI="mongodb+srv://..."
   NEXTAUTH_SECRET="a-long-random-string"
   NEXTAUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   NEXT_PUBLIC_NEWS_API=2c2d5c20c3a84c6e832a2e15d0274587
   ```

   If you use OAuth providers (e.g. GitHub, Google), also add:

   ```env
   GOOGLE_CLIENT_ID="your-google-cloud-console-generated-id"
   GOOGLE_CLIENT_SECRET="your-google-cloud-console-generated-secret"
   GITHUB_CLIENT_ID="your-github-developer-generated-id"
   GITHUB_CLIENT_SECRET="your-github-developer-generated-secret"
   ```

   To get the feature of IMAGE upload, and GIF fetch, add:

   ```env
   CLOUDINARY_CLOUD_NAME="your-cloudinary-generated-name"
   CLOUDINARY_API_KEY="your-cloudinary-generated-key"
   CLOUDINARY_API_SECRET="your-cloudinary-generated-secret"
   GIPHY_API_KEY="your-giphy-generated-key"
   ```

4. **Run mongoose migrations** (if you're using MongoDB):

   ```bash
   npm install mongoose
   ```

5. **Start the dev server**:

   ```bash
   npm run dev
   # then open http://localhost:3000 in your browser
   ```

## 🧪 Scripts

| Command          | Description                 |
| ---------------- | --------------------------- |
| `npm run dev`    | Run in development mode     |
| `npm run build`  | Build for production        |
| `npm run start`  | Start the production server |
| `npm run lint`   | Run ESLint                  |
| `npm run format` | Run Prettier                |

## 📈 Deploy

This app is deployed to **Vercel**:

1. Push your code to GitHub.
2. Import the repo in Vercel.
3. Add the same environment variables in Vercel’s dashboard.
4. Deploy!

## 🤝 Contributing

Contributions, issues and feature requests are welcome!

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/fooBar`)
3. Commit your changes (`git commit -a -m 'Add some fooBar'`)
4. Push to the branch (`git push origin feature/fooBar`)
5. Open a Pull Request

## 📄 License

Distributed under the MIT License.
