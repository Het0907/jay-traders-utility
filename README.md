# Jay Traders - Standalone Product Management Utility

A dedicated, standalone React web application for adding and managing products using the **Category → Product → Brand** hierarchy.

## Features

- **Category → Product → Brand Workflow**:
  1. Select or create Category / Subcategory
  2. Define Product Title, Description, and Image
  3. Set Brand Name (e.g., Mangalam, Superon, Taparia) and Size/Price Variants
- **Live Store Card Preview**: Shows real-time preview of how the brand/product card will render on the store.
- **Catalog Explorer**: Search, filter, and manage existing products in the MongoDB database.
- **Configurable API Endpoint**: Easily switch between `http://localhost:5000` and production `https://jaytraders-5.onrender.com`.
- **Standalone Deployment**: Can be built and deployed independently to Vercel, Netlify, or Render.

## Getting Started

### 1. Install Dependencies
```bash
cd utility
npm install
```

### 2. Run Locally
```bash
npm start
```
App will open at `http://localhost:3000`.

### 3. Deploy Separately
To create a static production bundle for independent hosting:
```bash
npm run build
```
The output `build/` folder can be uploaded directly to Vercel, Netlify, Render Static Site, or GitHub Pages.

## GitHub and environment variables

The `.gitignore` file excludes local environment files. Never commit `.env`, API keys,
database connection strings, JWT secrets, or service-account credentials. This frontend
only needs a public API URL, for example:

```dotenv
REACT_APP_API_URL=https://your-backend.example.com
```

Create that file locally as `.env.local` and set the same variable in the hosting
provider's project settings. Create a GitHub repository, choose **Private**, and push
the source (not the `build/` directory or `.env` files):

```bash
git init
git add .
git commit -m "Add product utility"
git branch -M main
git remote add origin https://github.com/YOUR_USER/YOUR_REPO.git
git push -u origin main
```

For Vercel, Netlify, or Render Static Site, import the repository, use `npm run build`
as the build command, and use `build` as the publish directory. Add
`REACT_APP_API_URL` in the provider's environment-variable settings, then redeploy.

GitHub Pages can host the static files, but it does not protect the app. Anyone who
can discover the URL can load the JavaScript bundle. Do not put secrets in any
`REACT_APP_*` variable: Create React App embeds those values in the browser bundle.

## Protecting the product utility

The current frontend has no login and calls product/category `GET`, `POST`, `PUT`, and
`DELETE` endpoints directly. Before deploying it for real use, protect the backend
routes. The backend should verify a Google OIDC/Firebase/Auth0 token, check an
allowlist of approved email addresses or (preferably) a domain/role claim, and reject
unauthorized requests with `401` or `403`. Authorization must be enforced by the
backend; hiding the frontend or adding a client-side password is not security.

The practical Google-account setup is:

1. Use Firebase Authentication, Auth0, Clerk, or Google Identity Services for Google
  sign-in in the frontend.
2. Send the resulting bearer token with every API request.
3. Verify the token on the backend and allow only the specific Google account emails
  (or your Google Workspace domain plus an admin role).
4. Keep the backend private at the data-operation layer, enable HTTPS and CORS only
  for the deployed utility origin, and never expose MongoDB directly to the browser.

A private GitHub repository controls source-code access. It does not restrict a
deployed website. To restrict the deployed utility to selected Google accounts, use
authentication plus backend authorization as described above. If all users are in a
Google Workspace, Google Cloud Identity-Aware Proxy is another option for protecting
the hosting service, subject to the hosting platform's support.
