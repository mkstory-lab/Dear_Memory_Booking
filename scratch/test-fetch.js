async function check() {
  const res = await fetch('https://dear-memory-booking.vercel.app');
  const html = await res.text();
  const buildIdMatch = html.match(/<!--(.*?)-->/);
  console.log('Build ID comment:', buildIdMatch ? buildIdMatch[1] : 'none');
  const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map(m => m[1]);
  console.log('Found scripts:', scripts);
  for (const s of scripts) {
    const sRes = await fetch(s.startsWith('http') ? s : 'https://dear-memory-booking.vercel.app' + s);
    console.log('Script status:', s, sRes.status);
  }
}
check().catch(console.error);
