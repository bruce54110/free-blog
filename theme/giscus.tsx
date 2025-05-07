import Giscus from '@giscus/react';
import { useDark } from 'rspress/runtime';

import styles from './Giscus.module.css';

export default function GiscusComment() {
    const isDark = useDark(); // 使用 useDark hook 获取当前主题模式
    console
    return (
        <div className={`${styles.container}`}>
            <Giscus
                id="giscus-comments"
                repo="bruce54110/free-blog"
                repoId="R_kgDOMT7e6w"
                category="Announcements"
                categoryId="DIC_kwDOMT7e684Cp2l_"
                mapping="pathname"
                term="Welcome to @giscus/react component!"
                reactionsEnabled="1"
                emitMetadata="0"
                inputPosition="top"
                theme="preferred_color_scheme"
                lang="zh-CN"
                loading="lazy"
            />
      </div>
    );
  }
