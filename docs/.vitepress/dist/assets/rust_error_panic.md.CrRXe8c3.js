import{_ as s,c as i,o as a,a2 as n}from"./chunks/framework.BBCWOUBu.js";const y=JSON.parse('{"title":"什么是panic ?","description":"","frontmatter":{},"headers":[],"relativePath":"rust/error/panic.md","filePath":"rust/error/panic.md"}'),h={name:"rust/error/panic.md"},t=n(`<h1 id="什么是panic" tabindex="-1">什么是panic ? <a class="header-anchor" href="#什么是panic" aria-label="Permalink to &quot;什么是panic ?&quot;">​</a></h1><p>Rust 中 panic 是一个非常重要的概念，它是 Rust 中处理错误的一种方式。panic 是 Rust 中的一种错误处理机制，它可以在程序运行时发生错误时停止程序的执行，并输出错误信息。</p><p>当程序遇到下列问题的时候，就可以断定程序自身存在bug，故而会引发panic:</p><ul><li>数组越界访问</li><li>整数除以0</li><li>在恰好为Err的Result上调用.expect()</li><li>断言失败</li></ul><p>演示数组下标越界发生panic，代码示例：</p><div class="language-rust vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rust</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">fn</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> main</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">    let</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> v </span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> vec!</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">[</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">1</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">2</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">, </span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">3</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">];</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">    v[</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;">99</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">];</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>输出：</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">thread</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &#39;main&#39;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> panicked</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> crates/error_demo/src/main.rs:4:6:</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">index</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> out</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> of</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> bounds:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> the</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> len</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> is</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 3</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> but</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> the</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> index</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> is</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 99</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">note:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> run</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> with</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> \`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">RUST_BACKTRACE</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">1\`</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> environment</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> variable</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> to</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> display</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> a</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> backtrace</span></span></code></pre></div><p>设置 <code>RUST_BACKTRACE=1</code> 环境变量可以展示出完整的错误栈信息</p><div class="language-bash vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">bash</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">thread</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> &#39;main&#39;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> panicked</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> crates/error_demo/src/main.rs:4:6:</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">index</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> out</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> of</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> bounds:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> the</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> len</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> is</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 3</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> but</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> the</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> index</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> is</span><span style="--shiki-light:#005CC5;--shiki-dark:#79B8FF;"> 99</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">stack</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> backtrace:</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   0:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> rust_begin_unwind</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/std/src/panicking.rs:652:5</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   1:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> core::panicking::panic_fmt</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/panicking.rs:72:14</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   2:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> core::panicking::panic_bounds_check</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/panicking.rs:275:5</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   3:</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> &lt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">usize</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> as</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> core::slice::index::SliceIndex</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">[T</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">]</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&gt;&gt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">::index</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/slice/index.rs:249:10</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   4:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> core::slice::index::</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">impl</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> core::ops::index::Index</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">I</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&gt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> for</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> [T]</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&gt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">::index</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/slice/index.rs:18:9</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   5:</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> &lt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">alloc::vec::Vec</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">T,</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">A</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&gt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> as</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> core::ops::index::Index</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&lt;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">I</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">&gt;&gt;</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">::index</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/alloc/src/vec/mod.rs:2907:9</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   6:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> error_demo::main</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> ./src/main.rs:4:6</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">   7:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> core::ops::function::FnOnce::call_once</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">             at</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> /rustc/129f3b9964af4d4a709d1383930ade12dfe7c081/library/core/src/ops/function.rs:250:5</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">note:</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> Some</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> details</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> are</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> omitted,</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> run</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> with</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;"> \`</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">RUST_BACKTRACE</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">=</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">full\`</span><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;"> for</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;"> a verbose backtrace.</span></span></code></pre></div><hr><blockquote><p>panic!() 是一种宏，用于处理程序中出现错误的情况。当你的代码检测到出现错误并需要立即触发panic时，就可以使用这个宏。panic!()可以接收类似println!() 的可选参数表，用于构建错误信息。</p></blockquote><p>直接使用panic!宏，代码示例：</p><div class="language-rust vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang">rust</span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span style="--shiki-light:#D73A49;--shiki-dark:#F97583;">fn</span><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;"> main</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">() {</span></span>
<span class="line"><span style="--shiki-light:#6F42C1;--shiki-dark:#B392F0;">    panic!</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">(</span><span style="--shiki-light:#032F62;--shiki-dark:#9ECBFF;">&quot;this is a panic!&quot;</span><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">);</span></span>
<span class="line"><span style="--shiki-light:#24292E;--shiki-dark:#E1E4E8;">}</span></span></code></pre></div><p>执行结果：</p><div class="language- vp-adaptive-theme"><button title="Copy Code" class="copy"></button><span class="lang"></span><pre class="shiki shiki-themes github-light github-dark vp-code" tabindex="0"><code><span class="line"><span>thread &#39;main&#39; panicked at crates/error_demo/src/main.rs:2:5:</span></span>
<span class="line"><span>this is a panic!</span></span>
<span class="line"><span>note: run with \`RUST_BACKTRACE=1\` environment variable to display a backtrace</span></span></code></pre></div><h1 id="展开与中止调用栈" tabindex="-1">展开与中止调用栈 <a class="header-anchor" href="#展开与中止调用栈" aria-label="Permalink to &quot;展开与中止调用栈&quot;">​</a></h1><p>默认情况下，当panic发生，程序栈展开调用栈（工作量大），Rust沿着调用栈往回走，清理每个遇到的函数中的数据。</p><p>中止调用栈：不进行清理，直接停止程序。内存需要OS进行清理。</p>`,19),p=[t];function k(l,e,F,r,d,c){return a(),i("div",null,p)}const E=s(h,[["render",k]]);export{y as __pageData,E as default};
