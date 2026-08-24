# Pastor Jonathan’s Birthday Picks

A colorful, unofficial family planner for the supplied Walt Disney World 2026 rides and attractions video.

## What it does

- Presents all 155 named experiences in source-video order.
- Links every card to its exact YouTube timestamp.
- Lets each family member build and reorder a personal Top 33.
- Syncs private invitation-link rooms through a Supabase Edge Function.
- Produces a transparent combined family leaderboard.

## Scoring

Rank 1 earns 33 points and rank 33 earns 1 point. Ties resolve by number of family wishlists, first-place votes, average rank, then source-video order.

## Development

```bash
npm install
npm test
npm run dev
```

Set `VITE_ROOM_API_URL` to the deployed `family-room` Edge Function. The browser receives no Supabase service key; room authorization uses an unguessable secret stored in the invitation-link hash.

## Rights note

This is an unofficial private-family planning tool and is not affiliated with or endorsed by Disney. Attraction images are storyboard frames derived from the public source video supplied for this project; names and marks remain the property of their respective owners.
