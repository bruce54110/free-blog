import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/free-blog/',
  title: "My blog",
  description: "这是一个记录个人工作生活的博客",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '工作', link: '/work/' },
      { text: '生活', link: '/life/' }
    ],

    sidebar: {
      '/work/':[
        {
          text: '工作',
          items: [
            { text: '测试1', link: '/work/one' },
            { text: 'spring',
              link: '/work/spring/',
              items:[
                { text: 'spring源码', link: '/work/spring/spring-source-code' },
              ] 
            },
            { text: '测试2', link: '/work/two' },
            { text: 'Introduction from Examples', link: '/guide/' }
          ]
        }
      ],
      '/life/':[
        {
          text: '生活',
          items: [
            { text: 'Markdown Examples', link: '/markdown-examples' },
            { text: 'Runtime API Examples', link: '/api-examples' },
            { text: 'Introduction from Examples', link: '/guide/' }
          ]
        }
      ]
    },

    /**
    sidebar: [
      {
        text: '工作',
        items: [
          { text: 'Markdown Examples', link: '/markdown-examples' },
          { text: 'Runtime API Examples', link: '/api-examples' },
          { text: 'Introduction from Examples', link: '/guide/' }
        ]
      },
      {
        text: '生活',
        items: [
          // 显示的是 `/guide/index.md` 页面
          { text: 'Introduction', link: '/life/' }
        ]
      }
    ], */

    socialLinks: [
      { icon: 'github', link: 'https://github.com/vuejs/vitepress' }
    ]
  }
})
