import dotenv from 'dotenv';
import app from './app.js';
import { initDB } from './models/index.js';
dotenv.config();

const PORT = process.env.PORT || 4000;

(async () => {
  await initDB(); // conecta y sincroniza la base de datos
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
})();
