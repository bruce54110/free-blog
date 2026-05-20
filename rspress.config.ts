import * as path from 'node:path';
import { defineConfig } from '@rspress/core';
import { pluginLess } from '@rsbuild/plugin-less';

import mermaid from 'rspress-plugin-mermaid';
import ga from 'rspress-plugin-google-analytics';
import readingTime from 'rspress-plugin-reading-time';


export default defineConfig({
  root: path.join(__dirname, 'docs'),
  plugins: [
    mermaid(),
    ga({
      id: 'G-M0BGESLHGT',
    }),
    readingTime(),
  ],
  builderConfig: {
    plugins: [pluginLess()],
  },
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

  },
});
