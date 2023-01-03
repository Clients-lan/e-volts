import { defineConfig } from 'astro/config';

// https://astro.build/config
import vue from "@astrojs/vue";

// https://astro.build/config
import deno from '@astrojs/deno';

// https://astro.build/config
export default defineConfig({
  integrations: [vue()],
  output: "server",
  adapter: deno()
});