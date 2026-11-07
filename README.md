# react-interface

A React app that runs CRUD operations against the **Posts** resource of
[jsonplaceholder.org](https://jsonplaceholder.org/). Unit tests use **Mocha** (runner),
**Chai** (assertions), and **Sinon** (stubs and spies).

## Getting started

Requires Node.js 20.6 or newer.

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # run the unit tests
npm run test:watch
npm run build && npm run preview
```

## Features

| Operation | UI action                         | Request                |
| --------- | --------------------------------- | ---------------------- |
| Read      | List loads on start, **Reload**   | `GET /posts`           |
| Create    | **New post** → **Create post**    | `POST /posts`          |
| Update    | **Edit** → **Save changes**       | `PUT /posts/:id`       |
| Delete    | **Delete** (asks for confirmation) | `DELETE /posts/:id`    |

The app also has client-side search, form validation, loading and error states, and a
dismissible error banner. `getPost` and `patchPost` are in the API client too, but the UI
does not use them.

## Behavior of jsonplaceholder.org

- **No CORS headers.** Browsers block direct requests from `localhost`, so the app calls
  `/api/*` and Vite proxies those calls to `https://jsonplaceholder.org` (see
  [vite.config.js](vite.config.js)). The proxy runs only under `npm run dev` and
  `npm run preview`. To deploy, you need your own proxy, or you can set
  `VITE_API_BASE_URL` to an endpoint that allows CORS.
- **Writes are not saved.** POST, PUT, PATCH, and DELETE return `200` with the original
  data (POST returns the entire list). After a successful request, the app applies the
  change to its own state. A reload brings back the original 100 posts.
- **Unknown ids redirect.** Requests for an id the server doesn't have (such as a post you
  created, id 101+) get a `301` to the HTML homepage. The API client reports this as a 404.
  The app marks posts created in the browser as `local` and edits or deletes them without
  calling the server.

## Project layout

```
src/
  api/postsApi.js           fetch wrapper: getPosts, getPost, createPost, updatePost, patchPost, deletePost
  state/postsReducer.js     pure reducer plus nextId and slugify helpers
  components/PostForm.jsx   create/edit form with validation
  components/PostList.jsx   post cards with Edit/Delete
  App.jsx                   ties it all together (takes `api` and `confirm` props for testing)
test/
  setup.js                  jsdom globals and cleanup between tests (sinon.restore, RTL cleanup)
  helpers.js                fake fetch Response and post factory
  api/postsApi.test.js      stubs globalThis.fetch with Sinon to check URLs, methods, bodies, errors
  state/postsReducer.test.js
  components/*.test.jsx     component tests with React Testing Library and user-event
  App.test.jsx              full CRUD flows with a Sinon-stubbed API
```

Mocha loads `.jsx` through [tsx](https://github.com/privatenumber/tsx), configured in
[.mocharc.json](.mocharc.json). The tests never touch the network.
