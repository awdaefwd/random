export const PROMPTS =
{ 
    SINGLE_TRACK_ANALYSIS: (track: string, artist: string, album: string) => 
        `You are a music analysis system.
        Analyze the track and return ONLY valid JSON.

        Use EXACTLY this structure (no variations, no extra text):
        Track: "${track}"
        Artist(s): "${artist}"
        Album: "${album}"
        
        {
        "genre": string,
        "subgenre": string,
        "mood": string[],
        "energy": "low" | "medium" | "high",
        "tempo": "slow" | "medium" | "fast",
        "bpm": number,
        characteristics: string[],
        similar_artists: string[],
        similar_tracks: string[],
        "summary": string
        }
        Rules:
        - Do NOT rename fields
        - Do NOT use spaces in keys
        - Do NOT add extra fields
        - Always return valid JSON
        - "genre" must be a broad category (e.g. Pop, Rock, Hip-Hop)
        - "subgenre" must be more specific (e.g. heavy metal, pop-funk)
        - use the artist style as an indicator of the genre, but also consider the track characteristics
        
        IMPORTANT TAXONOMY RULE FOR EDM GENRES:
        - "genre" must be the MAIN EDM STYLE (NOT "Electronic")
        - Do NOT use "Electronic" as a genre

        Allowed genres include (but are not limited to):
        - Drum and Bass
        - Dubstep
        - House
        - Techno
        - Trance
        - Breakbeat
        - Garage
        - Ambient
        - Hardstyle

        "subgenre" must be a more specific style within the genre.

        Examples:
        - genre: Drum and Bass
        subgenre: Jump-up / Liquid / Neurofunk / Dancefloor / Minimal DnB

        - genre: Dubstep
        subgenre: Brostep / Deep Dubstep / Riddim

        - genre: House
        subgenre: Deep House / Tech House / Progressive House

        If unsure, prefer a specific EDM genre over "Electronic".`,

    LISTENING_VIBE: (tracks: Array<{ name: string; artists: string; album: string }>) =>
        `You are a playful music curator. Based only on this Spotify top tracks metadata, create a short, imaginative listening-vibe profile. Do not claim you heard the audio or know the listener personally. Return only valid JSON with exactly these fields: "headline" (short title), "persona" (playful one-line archetype), "moods" (array of 3 short tags), and "description" (two friendly sentences). Keep it positive and specific to the mix; avoid unsupported factual claims.

Tracks:
${JSON.stringify(tracks)}`,

    MOOD_MIX: (
        mood: string,
        tracks: Array<{ id: string; name: string; artists: string; album: string }>,
    ) =>
        `You are a playlist curator. Arrange tracks from this playlist into a ${mood} listening mix. Use only the supplied track IDs; do not invent, modify, or repeat IDs. Return ONLY valid JSON with exactly one field: "trackIds", an array of 15 unique IDs in the best listening order (or all available tracks if fewer than 15). Choose tracks that fit the requested mood based only on title, artist, and album metadata, and make the sequence flow naturally. Do not claim to have heard the audio.

Tracks:
${JSON.stringify(tracks)}`,

    PLAYLIST_ANALYSIS: (playlistName: string, trackCount: number) => `You are a music analysis system.`,
}