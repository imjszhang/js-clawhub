/**
 * 简体中文语言包
 * JS ClawHub 默认语言
 */
(function() {
    const locale = {
        // 导航
        nav: {
            projects: 'PROJECTS',
            skills: 'SKILLS',
            blog: 'BLOG',
            pulse: 'PULSE',
            guide: 'GUIDE',
            submit: 'Submit',
            submitProject: 'SUBMIT PROJECT',
        },

        // 页脚
        footer: {
            tagline: 'OpenClaw 生态项目导航',
        },

        // 首页
        home: {
            pageTitle: 'JS ClawHub - OpenClaw 生态项目导航',
            metaDesc: 'JS 精选的 OpenClaw 生态项目导航站，发现技能、集成、教程与社区资源',
            curatedBadge: '// CURATED BY JS',
            heroDesc: 'JS 精选的 OpenClaw 生态项目导航。发现技能、集成、教程与<span class="bg-black text-brand-yellow px-1">社区资源</span>。',
            searchPlaceholder: '搜索项目、技能、教程...',
            featured: 'Featured',
            categories: 'Categories',
            fromJs: 'From JS',
            latestPulse: 'Latest Pulse',
            viewAll: 'VIEW ALL →',
            statsProjects: 'Projects',
            statsSkills: 'Skills',
            statsIntegrations: 'Integrations',
            statsTutorials: 'Tutorials',
        },

        // 博客
        blog: {
            pageTitle: '博客 - JS ClawHub',
            metaDesc: 'OpenClaw 生态教程、评测与技术分享',
            heroDesc: 'OpenClaw 生态教程、评测与<span class="bg-black text-brand-yellow px-1">技术分享</span>。',
            loadingPosts: 'LOADING POSTS...',
            noPosts: '// NO POSTS YET',
            noPostsDesc: '文章即将上线，敬请期待。',
            errorTitle: '// ERROR LOADING POSTS',
            errorDesc: '加载失败，请刷新页面重试。',
            loadingPost: 'LOADING POST...',
            postNotFound: '// POST NOT FOUND',
            browseAll: 'BROWSE ALL POSTS',
            backToBlog: '← BACK TO BLOG',
        },

        // 技能市场
        skills: {
            pageTitle: '技能市场 - JS ClawHub',
            metaDesc: '发现和探索 OpenClaw 社区技能，扩展你的 AI 助手能力',
            heroDesc: '发现和探索 OpenClaw 社区技能，扩展你的 AI 助手<span class="bg-black text-brand-yellow px-1">能力边界</span>。',
            searchPlaceholder: '搜索技能...',
            loadingSkills: 'LOADING SKILLS...',
            errorLoading: '// ERROR LOADING SKILLS',
            noSkillsInCategory: '// NO SKILLS IN THIS CATEGORY',
            backToSkills: '← BACK TO SKILLS',
            detailPageTitle: '技能详情 - JS ClawHub',
            detailMetaDesc: 'OpenClaw 技能详情',
            loadingDetail: 'LOADING...',
            docComingSoon: '// 详细文档即将上线',
            install: 'Install',
            readyToInstall: '✓ Ready to install',
            skillNotFound: '// SKILL NOT FOUND',
            browseAllSkills: 'BROWSE ALL SKILLS',
            source: 'SOURCE',
        },

        // 入门指南
        guide: {
            pageTitle: '入门指南 - JS ClawHub',
            metaDesc: 'OpenClaw 入门指南 - 从零开始配置你的个人 AI 助手',
            heroDesc: '从零开始配置你的 OpenClaw <span class="bg-black text-brand-yellow px-1">个人 AI 助手</span>。',
            toc: '目录',
            loadingGuide: 'LOADING GUIDE...',
            errorLoading: '// ERROR LOADING GUIDE',
            guideNotFound: '// GUIDE NOT FOUND',
        },

        // Pulse
        pulse: {
            pageTitle: 'Pulse - JS ClawHub',
            metaDesc: 'OpenClaw 生态 X 热点速递，AI 筛选的社区动态',
            heroDesc: 'OpenClaw 生态<span class="bg-black text-brand-yellow px-1">X 热点速递</span>。AI 筛选，JS 策展。',
            loadingPulse: 'LOADING PULSE...',
            noPulse: '// NO PULSE YET',
            noPulseDesc: 'Run <code class="bg-black text-brand-yellow px-2 py-1 font-mono text-sm">npm run sync-pulse</code> to populate.',
            errorTitle: '// ERROR LOADING PULSE',
            errorDesc: 'Failed to load data. Please refresh.',
            items: 'items',
        },

        // 搜索
        search: {
            noResults: '// NO RESULTS FOUND',
        },

        // 通用
        common: {
            loading: '加载中...',
        },
    };

    window.I18nLocales['zh-CN'] = locale;
})();
