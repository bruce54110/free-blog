import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

import mermaid from 'rspress-plugin-mermaid';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [mermaid()],
  base: '/free-blog/',
  title: 'My Blog',
  icon: '/free-blog-logo.png',
  logo: {
     light: '/free-blog-logo.png',
     dark: '/free-blog-logo.png',
  },
  themeConfig: {
    socialLinks: [
      {
        icon: 'github',
        mode: 'link',
        content: 'https://github.com/BruceZhang54110/',
      },
    ],
    prevPageText: '上一页',
    nextPageText: '下一页',
  },
});
