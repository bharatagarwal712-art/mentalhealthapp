// api/config.js
module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json({
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || ''
  });
};
