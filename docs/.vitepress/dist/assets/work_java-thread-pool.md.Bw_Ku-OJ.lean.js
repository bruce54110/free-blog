import{_ as h,D as t,c as l,b as k,w as s,a3 as p,a2 as a,o as i,I as e,a as r}from"./chunks/framework.BBCWOUBu.js";const T=JSON.parse('{"title":"Java线程池","description":"","frontmatter":{},"headers":[],"relativePath":"work/java-thread-pool.md","filePath":"work/java-thread-pool.md"}'),d={name:"work/java-thread-pool.md"},E=a("",6),g=a("",12);function y(o,c,F,A,D,C){const n=t("Mermaid");return i(),l("div",null,[E,(i(),k(p,null,{default:s(()=>[e(n,{id:"mermaid-18",class:"mermaid my-class",graph:"classDiagram%0A%20%20%20%20class%20Executor%20%7B%0A%20%20%20%20%09%20execute(Runnable%20command)%0A%20%20%20%20%7D%0A%20%20%20%20class%20ExecutorService%20%7B%0A%20%20%20%20%09shutdown()%0A%20%20%20%20%09isShutdown()%20boolean%0A%20%20%20%20%09isTerminated()%20boolean%0A%20%20%20%20%20%20submit(Callable~T~%20task)%20Future~T~%0A%20%20%20%20%7D%0A%20%20%20%20class%20ThreadPoolExecutor%20%7B%0A%20%20%20%20%09execute(Runnable%20command)%0A%20%20%20%20%7D%0A%20%20%20%20Executor%20%3C%7C--%20ExecutorService%0A%20%20%20%20ExecutorService%20%3C%7C..%20AbstractExecutorService%0A%20%20%20%20AbstractExecutorService%20%3C%7C--%20ThreadPoolExecutor%0A"})]),fallback:s(()=>[r(" Loading... ")]),_:1})),g])}const m=h(d,[["render",y]]);export{T as __pageData,m as default};
