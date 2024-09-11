import{_ as k,D as E,c as r,b as e,w as s,a3 as l,j as a,a as n,a2 as p,o as i,I as h}from"./chunks/framework.BBCWOUBu.js";const j=JSON.parse('{"title":"什么是循环依赖？","description":"","frontmatter":{},"headers":[],"relativePath":"work/spring/spring-circular-dependency.md","filePath":"work/spring/spring-circular-dependency.md"}'),g={name:"work/spring/spring-circular-dependency.md"},d=a("h1",{id:"什么是循环依赖",tabindex:"-1"},[n("什么是循环依赖？ "),a("a",{class:"header-anchor",href:"#什么是循环依赖","aria-label":'Permalink to "什么是循环依赖？"'},"​")],-1),c=a("p",null,"循环依赖就是循环引用，就是两个或多个bean相互之间的持有对方。比如CircleA引用CircleB，CircleB引用CircleC，CircleC引用CircleA。",-1),o=p("",15),y=p("",47);function A(F,B,b,C,D,u){const t=E("Mermaid");return i(),r("div",null,[d,c,(i(),e(l,null,{default:s(()=>[h(t,{id:"mermaid-6",class:"mermaid my-class",graph:"graph%20LR%3B%0AA--%3EB%0AB--%3EC%0AC--%3EA%0A"})]),fallback:s(()=>[n(" Loading... ")]),_:1})),o,(i(),e(l,null,{default:s(()=>[h(t,{id:"mermaid-59",class:"mermaid my-class",graph:"sequenceDiagram%3B%0A%20%20%20%20%23%20%E8%B5%B7%E5%88%AB%E5%90%8D%0A%20%20%20%20participant%20A%20as%20AbstractBeanFactory.java%0A%20%20%20%20participant%20D%20as%20DefaultSingletonBeanRegistry.java%0A%20%20%20%20participant%20AF%20as%20AbstractAutowireCapableBeanFactory.java%0A%20%20%20%20%23%20%E5%BC%80%E5%A7%8B%E7%94%BB%E6%97%B6%E5%BA%8F%E5%9B%BE%0A%20%20%20%20A-%3E%3ED%3AgetBean(%22a%22)%0A%20%20%20%20Note%20over%20A%2CD%3A%20%E9%A6%96%E6%AC%A1%E8%8E%B7%E5%8F%96Bean%20a%0A%20%20%20%20D-%3E%3ED%3AgetSingleton(%22a%22%2C%20true)%0A%20%20%20%20Note%20over%20D%2CD%3A%E5%9C%A8%E4%B8%80%E7%BA%A7%E7%BC%93%E5%AD%98%E4%B8%AD%E6%9F%A5%E6%89%BEBean%20a%20%E4%B8%BA%E7%A9%BA%0A%20%20%20%20D%20-%3E%3E%20D%3Athis.singletonFactories.get(%22a%22)%E4%B8%BA%E7%A9%BA%0A%20%20%20%20Note%20over%20D%2CD%3A%E5%9C%A8%E4%BA%8C%E7%BA%A7%E5%92%8C%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%E4%B8%AD%E6%9F%A5%E6%89%BEBean%20a%20%E4%B8%BA%E7%A9%BA%0A%20%20%20%20D--%3E%3EA%3A%20%E8%BF%94%E5%9B%9E%20sharedInstance%20%22a%22%20%E4%B8%BA%E7%A9%BA%EF%BC%88%E7%BC%93%E5%AD%98%E9%87%8C%E6%B2%A1%E6%9C%89%EF%BC%89%0A%20%20%20%20A-%3E%3ED%3A%20getSingleton(%22a%22%2C%20ObjectFactory%3C%3F%3E%20singletonFactory)%0A%20%20%20%20D%20-%3E%3E%20D%3A%20singletonFactory.getObject()%0A%20%20%20%20Note%20over%20D%2CD%3A%20%E8%B0%83%E7%94%A8%E7%9A%84%E6%98%AF%20createBean(beanName%2C%20mbd%2C%20args)%E6%96%B9%E6%B3%95%0A%20%20%20%20D-%3E%3EAF%3A%20createBean(%22a%22%2C%20mbd%2C%20args)%0A%20%20%20%20AF--%3E%3EAF%3A%20doCreateBean(%22a%22%2C%20mbdToUse%2C%20args)%0A%20%20%20%20AF--%3E%3EAF%3AcreateBeanInstance(%22a%22%2C%20mbd%2C%20args)%20%E5%AE%9E%E4%BE%8B%E5%8C%96%0A%20%20%20%20AF--%3E%3EAF%3AaddSingletonFactory(%22a%22%2C%20singletonFactory)%20%E6%B7%BB%E5%8A%A0%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%E5%B7%A5%E5%8E%82%E6%96%B9%E6%B3%95%0A%20%20%20%20Note%20over%20AF%3A%20%E6%94%BE%E7%BD%AE%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%20key%20%E6%98%AF%20beanName%2Cvalue%E6%98%AFObjectFactory%20%E5%AE%9E%E7%8E%B0%E6%98%AFgetEarlyBeanReference(beanName%2C%20mbd%2C%20bean))%0A%20%20%20%20AF%20--%3E%3E%20AF%3ApopulateBean%EF%BC%8C%E5%AF%BB%E6%89%BE%E6%B3%A8%E5%85%A5%E6%89%80%E4%BE%9D%E8%B5%96%E7%9A%84%22b%22%0A%20%20%20%20AF--%3E%3E%20A%3A%20getBean(%22b%22)%0A%20%20%20%20A-%3E%3ED%3AgetSingleton(%22b%22%2C%20true)%0A%20%20%20%20D--%3E%3EA%3A%20%E8%BF%94%E5%9B%9E%20sharedInstance%20%22b%22%20%E4%B8%BA%E7%A9%BA%EF%BC%88%E7%BC%93%E5%AD%98%E9%87%8C%E6%B2%A1%E6%9C%89%EF%BC%89%0A%20%20%20%20A-%3E%3ED%3A%20getSingleton(%22b%22%2C%20ObjectFactory%3C%3F%3E%20singletonFactory)%0A%20%20%20%20D%20-%3E%3E%20D%3A%20singletonFactory.getObject()%0A%20%20%20%20D-%3E%3EAF%3A%20createBean(%22b%22%2C%20mbd%2C%20args)%0A%20%20%20%20AF--%3E%3EAF%3A%20doCreateBean(%22b%22%2C%20mbdToUse%2C%20args)%0A%20%20%20%20AF--%3E%3E%20AF%3AcreateBeanInstance(%22b%22%2C%20mbd%2C%20args)%20%E5%AE%9E%E4%BE%8B%E5%8C%96%0A%20%20%20%20AF--%3E%3E%20AF%3AaddSingletonFactory(%22b%22%2C%20singletonFactory)%20%E6%B7%BB%E5%8A%A0%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%E5%B7%A5%E5%8E%82%E6%96%B9%E6%B3%95%0A%20%20%20%20AF--%3E%3E%20AF%3ApopulateBean%EF%BC%8C%E5%AF%BB%E6%89%BE%E6%B3%A8%E5%85%A5%E6%89%80%E4%BE%9D%E8%B5%96%E7%9A%84%22a%22%0A%20%20%20%20AF%20--%3E%3E%20A%3A%20getBean(%22a%22)%0A%20%20%20%20A%20-%3E%3E%20D%3AgetBean(%22a%22)%0A%20%20%20%20D%20-%3E%3E%20D%3AgetSingleton(%22a%22%2C%20true)(%E8%BF%99%E9%87%8C%E6%A0%87%E8%AE%B01%EF%BC%8C%E5%AF%B9%E5%BA%94%E5%90%8E%E7%BB%AD%E7%9A%841')%0A%20%20%20%20D%20-%3E%3E%20D%3Athis.singletonFactories.get(%22a%22)%EF%BC%88%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%E6%9C%89a%E5%80%BC%EF%BC%89%0A%20%20%20%20Note%20over%20D%2CD%3A%20%E8%BF%99%E9%87%8C%E4%BB%8E%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%E4%B8%AD%E5%8F%96%E5%80%BC%EF%BC%8C%E5%B0%B1%E6%98%AF%E8%A6%81%E8%B0%83%E7%94%A8singletonFactory.getObject()%E6%96%B9%E6%B3%95%EF%BC%8C%E5%AF%B9%E5%BA%94%E5%89%8D%E9%9D%A2%E6%94%BE%E7%BD%AE%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98%20key%20%E6%98%AF%20beanName%2Cvalue%E6%98%AFObjectFactory%20%E5%AE%9E%E7%8E%B0%E6%98%AFgetEarlyBeanReference(beanName%2C%20mbd%2C%20bean))%0A%20%20%20%20D%20-%3E%3E%20D%3AsingletonFactory.getObject()%0A%20%20%20%20D-%3E%3E%20AF%3A%20getEarlyBeanReference%20%E8%8E%B7%E5%8F%96%E6%97%A9%E6%9C%9F%E7%9A%84Bean%20%22a%22%0A%20%20%20%20AF%20--%3E%3E%20AF%3A%20%E8%8B%A5%E6%9C%89AOP%EF%BC%8C%E4%BC%9A%E6%8F%90%E5%89%8D%E5%A4%84%E7%90%86AOP%E7%9B%B8%E5%85%B3%E9%80%BB%E8%BE%91%0A%20%20%20%20AF%20--%3E%3E%20D%3A%20exposedObject%0A%20%20%20%20D%20-%3E%3ED%3A%20%E6%8A%8A%20Bean%20%22a%22%20%E6%94%BE%E5%88%B0%E4%BA%8C%E7%BA%A7%E7%BC%93%E5%AD%98%EF%BC%8C%E7%A7%BB%E9%99%A4%E4%B8%89%E7%BA%A7%E7%BC%93%E5%AD%98(%E8%BF%99%E9%87%8C%E6%A0%87%E8%AE%B01'%E5%AF%B9%E5%BA%94%E5%89%8D%E8%BE%B9%E7%9A%841)%0A%20%20%20%20D%20--%3E%3E%20A%3A%E8%BF%94%E5%9B%9E%E6%8F%90%E6%97%A9%E6%9A%B4%E9%9C%B2%E7%9A%84Bean%20%22a%22%0A%20%20%20%20A%20-%3E%3E%20AF%3A%20%E8%BF%94%E5%9B%9EBean%20%22a%22%2C%E5%B0%86%22a%22%E6%B3%A8%E5%85%A5%E5%88%B0%20%22b%22%E5%BD%93%E4%B8%AD(b%E7%BB%88%E4%BA%8E%E6%89%BE%E5%88%B0a%E4%BA%86)%0A%20%20%20%20AF%20--%3E%3E%20AF%3AinitializeBean(%22b%22%2C%20exposedObject%2C%20mbd)%EF%BC%8C%E6%9C%89AOP%E7%9A%84%E8%AF%9D%EF%BC%8C%E4%BC%9A%E5%9C%A8%E8%BF%99%E9%87%8C%E5%A4%84%E7%90%86%0A%20%20%20%20AF--%3E%3EAF%3AObject%20earlySingletonReference%20%3D%20getSingleton(%22b%22%2C%20false)%20%E4%B8%BAnull%EF%BC%8C%E5%9B%A0%E4%B8%BA%E4%BA%8C%E7%BA%A7%E7%BC%93%E5%AD%98%E4%B8%AD%E4%B8%BA%E7%A9%BA%0A%20%20%20%20AF--%3E%3EAF%3AexposedObject%20!%3D%20earlySingletonReference%20%E8%BF%94%E5%9B%9E%20b%0A%20%20%20%20AF%20--%3E%3E%20D%3A%E8%BF%94%E5%9B%9E%0A%20%20%20%20D%20--%3E%3E%20D%3AaddSingleton(%22b%22%2C%20singletonObject)%EF%BC%8C%E6%94%BE%E5%88%B0%E4%B8%80%E7%BA%A7%E7%BC%93%E5%AD%98%E4%B8%AD%0A%20%20%20%20D%20--%3E%3E%20A%3A%20%E8%BF%94%E5%9B%9Eb%20(getSingleton(%22b%22%2C%20ObjectFactory%3C%3F%3E%20singletonFactory))%0A%20%20%20%20A%20-%3E%3E%20AF%3A%20a%E7%BB%88%E4%BA%8E%E6%89%BE%E5%88%B0%E4%BA%86%E4%BE%9D%E8%B5%96%E7%9A%84b%0A%20%20%20%20AF%20--%3E%3E%20AF%3AinitializeBean(%22a%22%2C%20exposedObject%2C%20mbd)%EF%BC%8C%E6%9C%89AOP%E7%9A%84%E8%AF%9D%E4%BC%9A%E5%9C%A8%E6%AD%A4%E5%A4%84%E7%90%86%0A%20%20%20%20AF--%3E%3EAF%3AObject%20earlySingletonReference%20%3D%20getSingleton(%22a%22%2C%20false)%EF%BC%8C%E8%BF%99%E9%87%8C%E8%BF%94%E5%9B%9E%20a%20%E4%B8%8D%E6%98%AFnull%EF%BC%8C%E5%9B%A0%E4%B8%BA%E4%BA%8C%E7%BA%A7%E7%BC%93%E5%AD%98%E9%87%8C%E6%9C%89a%0A%20%20%20%20AF--%3E%3EAF%3AexposedObject%20%3D%20earlySingletonReference%20%E8%BF%94%E5%9B%9E%20a%0A%20%20%20%20AF%20--%3E%3E%20A%3A%E8%BF%94%E5%9B%9Ea%20%0A"})]),fallback:s(()=>[n(" Loading... ")]),_:1})),y])}const v=k(g,[["render",A]]);export{j as __pageData,v as default};
