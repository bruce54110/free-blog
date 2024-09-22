// https://vitepress.dev/reference/site-config
import { defineConfig } from 'vitepress'
import { withMermaid } from "vitepress-plugin-mermaid";

export default withMermaid({
  mermaid: {
    // refer https://mermaid.js.org/config/setup/modules/mermaidAPI.html#mermaidapi-configuration-defaults for options
  },
  // optionally set additional config for plugin itself with MermaidPluginConfig
  mermaidPlugin: {
    class: "mermaid my-class", // set additional css classes for parent container 
  },
  base: '/free-blog/',
  markdown: {
  },
  title: "My blog",
  description: "这是一个记录个人工作生活的博客",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: '主页', link: '/' },
      { text: '工作', link: '/work/' },
      { text: '生活', link: '/life/' },
      { text: '读书笔记', link: '/book/' }
    ],

    sidebar: {
      '/work/':[
        {
          text: '工作',
          items: [
            { text: 'spring',
              link: '/work/spring/',
              items:[
                { text: 'Spring Bean循环依赖探究', link: '/work/spring/spring-circular-dependency' }
              ] 
            },
            { text: '数据结构与算法',
              link: '/work/algorithms/',
              items:[
              ] 
            },
            { text: 'AI',
              link: '/work/ai/',
              items:[
                { text: '大模型RAG应用与LangChain4初探', link: '/work/ai/lang-chain-rag' }
              ] 
            }
          ]
        }
      ],
      '/life/':[
        {
          text: '生活',
          items: [
            { text: '点滴生活', link: '/life/my-life' }
          ]
        }
      ],
      '/book/':[
        {
          text: '读书笔记',
          items: [
            { text: '微服务设计', link: '/book/microservices-design/' },
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
  },
  head: [
    ['script',
      {
        async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-M0BGESLHGT'
      }
    ]
  ],
})




