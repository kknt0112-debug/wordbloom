# WordBloom

A private, browser-based vocabulary learning app. Type an English word and use **Find meaning** to automatically retrieve its definition, part of speech, pronunciation, example, and available audio. Then review due words with spaced flashcards.

Every saved word also has device-based spoken pronunciation. Review cards include a manual speaker button and an optional auto-pronounce setting; these use the device's installed English voice and do not depend on dictionary audio.

Select any saved vocabulary card to open its full word view, hear the pronunciation, edit it, or begin a focused review.

Imported words always include a device-powered **Pronounce** button, even when phonetic spelling or dictionary audio is unavailable.

Use **Missing letters** for a 10-word spelling exercise. WordBloom hides several letters, shows the definition as a clue, checks the completed word, and reports the session score.

The Netlify deployment includes opt-in Web Push reminders. Installed iPhone Home Screen apps can receive one due word and definition at 9:00 AM Pacific every day.

## Run locally

From this folder, run:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`. Data is saved in the browser's local storage. Use **Export** to create a backup.

## Deploy with notifications

Import this repository into Netlify and use the default build settings. Netlify installs the dependencies, provisions private Blob storage, and runs the scheduled push function automatically. After deployment, add the Netlify site to the iPhone Home Screen, open it from the new icon, and tap **Enable reminder**.
