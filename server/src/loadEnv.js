import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Loads .env as a side-effect import. This has to be its own module: ES
 * imports are evaluated before the importing file's body runs, so calling
 * dotenv.config() inside index.js happened *after* modules such as
 * middleware/auth.js had already read process.env (JWT_SECRET was always seen
 * as unset). index.js imports this file first, so it runs before the others.
 */
const __dirname = path.dirname(fileURLToPath(import.meta.url));

dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'server/.env') });
