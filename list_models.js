async function main() {
  const apiKey = process.env.GEMINI_API_KEY;
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
  const data = await res.json();
  if (data.models) {
    console.log(data.models.map(m => m.name).filter(n => n.includes('1.5') || n.includes('flash')));
  } else {
    console.log(data);
  }
}
main();
