import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
const dir = new URL('../apps/web/public/icons/', import.meta.url);
await mkdir(dir, { recursive: true });
const icon = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="112" fill="#174b3a"/><path d="M326 100a155 155 0 1 0 80 258 142 142 0 0 1-80-258Z" fill="#e9efcf"/><path d="m356 167 17 46 47 18-47 17-17 47-18-47-46-17 46-18Z" fill="#dfc366"/></svg>');
for (const size of [192, 512]) await sharp(icon).resize(size, size).png().toFile(new URL(`icon-${size}.png`, dir).pathname);
const mask = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#174b3a"/><path d="M310 145a118 118 0 1 0 61 197 109 109 0 0 1-61-197Z" fill="#e9efcf"/><path d="m337 195 13 35 36 14-36 13-13 36-14-36-35-13 35-14Z" fill="#dfc366"/></svg>');
await sharp(mask).resize(512, 512).png().toFile(new URL('maskable-512.png', dir).pathname);
console.log('Generated PWA icons.');