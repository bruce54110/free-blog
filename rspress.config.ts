import * as path from 'node:path';
import { defineConfig } from 'rspress/config';

import mermaid from 'rspress-plugin-mermaid';
import ga from 'rspress-plugin-google-analytics';

export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [
    mermaid(),
    ga({
      id: 'G-M0BGESLHGT',
    }),
  ],
  base: '/free-blog/',
  title: 'My Blog',
  icon: '/free-blog/free-blog-logo.png',
  logo: {
     light: '/free-blog/free-blog-logo.png',
     dark: '/free-blog/free-blog-logo.png',
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
