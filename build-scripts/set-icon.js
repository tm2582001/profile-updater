//! right now this just corrupts my file

import { resolve } from 'path';
import { fileURLToPath } from "url";
import rcedit from 'rcedit';
import path from "path";



const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const exePath = resolve(__dirname, "../build/profileUpdater.exe");

const iconPath = resolve(__dirname, "../profile-changer.ico");

await rcedit(exePath, {
  icon: iconPath
})