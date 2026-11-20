/**
 * Same-origin Vercel Serverless Function that proxies Google Drive / Docs PDF bytes
 * for the 3D E-book Flipbook reader without browser CORS blocks.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const rawId = Array.isArray(req.query?.id) ? req.query.id[0] : req.query?.id;
  const mode = Array.isArray(req.query?.mode) ? req.query.mode[0] : req.query?.mode;
  const docKind = Array.isArray(req.query?.docKind) ? req.query.docKind[0] : req.query?.docKind;

  if (!rawId || !/^[a-zA-Z0-9_-]{10,80}$/.test(rawId)) {
    return res.status(400).json({ error: 'Invalid Google Drive file ID' });
  }

  const exportUrl =
    docKind === 'presentation'
      ? `https://docs.google.com/presentation/d/${rawId}/export/pdf`
      : docKind === 'spreadsheet'
        ? `https://docs.google.com/spreadsheets/d/${rawId}/export?format=pdf`
        : `https://docs.google.com/document/d/${rawId}/export?format=pdf`;

  const downloadUrl = `https://drive.usercontent.google.com/download?id=${rawId}&export=download&confirm=t`;

  const candidateUrls =
    mode === 'export' ? [exportUrl, downloadUrl] : [downloadUrl, exportUrl];

  let lastStatus = 502;
  for (const targetUrl of candidateUrls) {
    try {
      const upstream = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; KBS-HR-Docs/1.0)'
        },
        redirect: 'follow'
      });

      if (!upstream.ok) {
        lastStatus = upstream.status;
        continue;
      }

      const arrayBuf = await upstream.arrayBuffer();
      const bytes = new Uint8Array(arrayBuf);
      const header = new TextDecoder('latin1').decode(
        bytes.subarray(0, Math.min(1024, bytes.byteLength))
      );

      if (!header.includes('%PDF-')) {
        lastStatus = 415;
        continue;
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Cache-Control', 'public, max-age=300, s-maxage=300');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      return res.status(200).send(Buffer.from(arrayBuf));
    } catch (err) {
      lastStatus = 502;
    }
  }

  return res.status(lastStatus).json({ error: 'Unable to fetch PDF from Google Drive' });
}
