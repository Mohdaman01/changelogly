const { GoogleGenerativeAI } = require('@google/generative-ai');

async function main() {
  const genAI = new GoogleGenerativeAI("AIzaSyAf5NG0ZLxwoF_vFpImCeYDsCM-0bc8qPs");
  const systemInstruction = `You are a changelog writer for TestProject. 
Write for software engineers. Use precise technical language. 
    Include function/API names where relevant. Group by: Breaking Changes, 
    New Features, Bug Fixes, Performance, Chores. Be concise and factual.

Rules:
- Output ONLY valid Markdown
- Start with a short title line (no #, just plain text) on the FIRST line
- Then a blank line
- Then the full changelog body using ## headings for groups
- Add relevant emoji to section headers (e.g. ## ✨ New Features)
- End with a JSON block on the last line: {"tags":["tag1","tag2"]} — max 5 tags
- If a commit message is meaningless (e.g. "fix", "wip", "update"), skip it
- Never mention internal tooling, CI, or dependency bumps in user-friendly/marketing tone`;

  const userPrompt = `Generate a changelog for TestProject Update.

Commits:
- [1234567] Migrated payment gateway from Stripe to Razorpay (John)
- [2345678] Migrated AI provider from OpenAI to Gemini (Jane)
- [3456789] Upgraded the Gemini model from 1.5-flash to 2.5-flash (Bob)`;

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction,
  });

  const result = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    generationConfig: {
      maxOutputTokens: 1500,
      temperature: 0.4,
    },
  });

  const raw = result.response.text();
  console.log("--- RAW ---");
  console.log(raw);

  const lines = raw.trim().split('\n');
  const title = lines[0].replace(/^#+\s*/, '').trim() || `TestProject Update`;
  let tags = [];
  const lastLine = lines[lines.length - 1];
  if (lastLine.startsWith('{')) {
    try {
      const parsed = JSON.parse(lastLine);
      tags = parsed.tags ?? [];
      lines.pop();
    } catch (e) { }
  }
  const content = lines.slice(2).join('\n').trim();
  console.log("--- TITLE ---");
  console.log(title);
  console.log("--- CONTENT ---");
  console.log(content);
  console.log("--- TAGS ---");
  console.log(tags);
}
main();
