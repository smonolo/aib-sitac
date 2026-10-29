# Privacy Policy — AIB SITAC

**Last updated:** 27 October 2026

AIB SITAC is an independent, unofficial web app for tactical wildfire (incendio boschivo) situation maps. It is open to anyone and is **not** affiliated with Protezione Civile, Vigili del Fuoco, Regione Lombardia, or any other public institution.

Hosted policy URL: [smnl.dev/aib-sitac/privacy](https://smnl.dev/aib-sitac/privacy)

## Summary

- Incident metadata and the append-only event log (marks) are stored in a **PostgreSQL database** operated for this product when you create or join a room.
- The **home interventi list** (and the list API) is **public**: each room includes title, creation date (`Europe/Rome`), optional creator display name (`createdBy`), and whether it is password-protected. Opening a room and seeing map marks still requires the link and, if set, the password.
- **No user accounts** in v1. Access is the intervento link, plus an optional password.
- **No analytics SDK** is included by default.
- Display name (profile on home/map; no login) is stored in browser `localStorage` and, when you add or remove a mark, is copied onto that event in the room timeline.
- Loading the map fetches raster tiles from Humanitarian OSM / openstreetmap.fr; that provider may see your IP and the tile coordinates you request.
- After unlocking a protected room, the password is kept in browser `sessionStorage` for that room (cleared when the browser session ends); it is never put in the URL.

## Data processed

| Data                                                                   | Where                    | Why                                   |
| ---------------------------------------------------------------------- | ------------------------ | ------------------------------------- |
| Title, created date, optional creator, “protected” flag (list API)     | Database (+ public API)  | Discover and open rooms from home     |
| Map center and initial zoom                                            | Database                 | Open the room at the right view       |
| Password hash (optional)                                               | Database                 | Protect edit/view access              |
| Map events (geometry, symbols, notes, timestamps, optional actor name) | Database                 | Collaborative SITAC + timeline replay |
| Optional display name (home/map profile; no login)                     | Browser `localStorage`   | Creator on new rooms + label on marks |
| Map tile requests (zoom/x/y)                                           | HOT OSM tile servers     | Render the map background             |
| Room password after unlock                                             | Browser `sessionStorage` | Re-open the room in the same session  |

## Access & room passwords

- Open rooms (no password): anyone with the link can view and edit; live updates use Server-Sent Events.
- Protected rooms: the password is sent only as an `X-Passphrase` HTTP header (never in the URL). The API stores a salted scrypt hash, not the password itself. Wrong-password attempts are rate-limited. Minimum length is 4 characters when set.
- After unlock, the password stays in `sessionStorage` for that room until the browser session ends.
- Optional display name stays in `localStorage`; when you create a room it may be stored as `createdBy`, and when you mark the map it is copied onto that event as `actorLabel`.

## Sharing & exports

GeoJSON / PNG exports and shared links leave the app under the rules of the tools you use next (chat, email, files).

## Contact

[stefano@smnl.dev](mailto:stefano@smnl.dev) · [smnl.dev](https://smnl.dev)
