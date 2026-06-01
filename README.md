# Juehyx Blog

This repository is a Hexo blog using the Redefine theme, designed for GitHub Pages.

## Local preview

```bash
npm install
npm run server
```

Open <http://localhost:4000>.

## Create a post

```bash
npx hexo new "文章标题"
```

Then edit the generated Markdown file under `source/_posts`.

## Deploy

Push to the `main` branch. GitHub Actions will build the site and deploy it to GitHub Pages.

In the GitHub repository settings, set:

- Settings -> Pages -> Build and deployment -> Source: GitHub Actions
