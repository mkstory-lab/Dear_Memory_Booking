async function findChunkWithText() {
  const html = await (await fetch('https://dear-memory-booking.vercel.app')).text();
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  for (const s of scripts) {
    const text = await (await fetch('https://dear-memory-booking.vercel.app' + s)).text();
    if (text.includes('예식일') || text.includes('CalendarModal') || text.includes('formatKoreanDate')) {
      console.log('Found in', s);
      const idx = text.indexOf('formatKoreanDate') !== -1 ? text.indexOf('formatKoreanDate') : text.indexOf('예식일');
      console.log(text.slice(Math.max(0, idx - 100), idx + 200));
    }
  }
}
findChunkWithText().catch(console.error);
