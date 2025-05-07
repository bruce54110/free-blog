import Theme from 'rspress/theme';
import React, { useState, useEffect } from 'react';
import { useDark } from 'rspress/runtime';


import styles from './style.module.css'; // 导入 CSS 模块

import yaml from 'js-yaml';
import recommendedArticlesYaml from './articles/recommended-articles.yaml?raw'; // 导入 YAML 文件内容

import GiscusComment from './giscus'; // 导入 Giscus 组件


function MyRecommendedArticle() {
    // 假设您的文章数据如下，您需要替换成您实际的数据
    const [articles, setArticles] = useState<any[]>([]);
    const isDark = useDark(); // 使用 useDark hook 获取当前主题模式

  useEffect(() => {
    try {
      const parsedArticles = yaml.load(recommendedArticlesYaml) as any[];
      console.log('Parsed articles:', parsedArticles);
      setArticles(parsedArticles.articles);
    } catch (error) {
      console.error('Error parsing YAML:', error);
    }
  }, []);

  return (
    <div className={styles.cardContainer}>
      {articles.map((article, index) => (
        <a key={index} href={article.link} className={`${styles.articleCard} ${isDark ? styles.articleCardDark : ''}`}> {/* 根据主题模式应用不同的 class */}
          {article.image && (
            <img src={article.image} alt={article.title} className={styles.linkCardImage} />
          )}
          <div className={`${styles.linkCardTitle} ${isDark ? styles.linkCardTitleDark : ''}`}>{article.title}</div>
          {article.description && (
            <div className={`${styles.linkCardDescription} ${isDark ? styles.linkCardDescriptionDark : ''}`}>{article.description}</div>
          )}
        </a>
      ))}
    </div>
  );
  }

const Layout = () => <Theme.Layout
  afterFeatures={MyRecommendedArticle()}
  afterDocContent={<div><GiscusComment /></div>}

/>;

export default {
  ...Theme,
  Layout,
};

export * from 'rspress/theme';