# Privacy Policy — AIB SITAC

**Last updated:** 26 October 2026

AIB SITAC is an independent, unofficial web app for tactical wildfire (incendio boschivo) situation maps. It is open to anyone and is **not** affiliated with Protezione Civile, Vigili del Fuoco, Regione Lombardia, or any other public institution.

Hosted policy URL: [smnl.dev/aib-sitac/privacy](https://smnl.dev/aib-sitac/privacy)

## Summary

- Incident metadata and the append-only event log (marks, snapshots) are stored in a **PostgreSQL database** operated for this product when you create or join a room.
- **No user accounts** in v1. Access is the incident link, plus an optional passphrase.
- **No analytics SDK** is included by default.
- UI language and optional display name are stored in the browser (local/session storage).

## Data processed

| Data                                                                    | Where           | Why                                   |
| ----------------------------------------------------------------------- | --------------- | ------------------------------------- |
| Incident title, map center                                              | Database        | Identify and open the room            |
| Passphrase hash (optional)                                              | Database        | Protect edit/view access              |
| Map events (geometry, symbols, notes, timestamps, optional actor label) | Database        | Collaborative SITAC + timeline replay |
| Locale / actor label                                                    | Browser storage | UI preference                         |

## Sharing & exports

GeoJSON / PNG exports and shared links leave the app under the rules of the tools you use next (chat, email, files).

## Contact

[stefano@smnl.dev](mailto:stefano@smnl.dev) · [smnl.dev](https://smnl.dev)
