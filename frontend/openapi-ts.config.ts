import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  client: 'axios',
  input: 'http://localhost:3000/api/docs-json',
  output: {
    path: 'src/lib/api/generated',
    format: 'prettier',
  },
  services: {
    asClass: true,
  },
});
