/**
 * 简体中文语言包
 * JS ClawHub 默认语言
 */
(function() {
    const locale = {
        // 导航
        nav: {
            projects: '项目',
            skills: '技能',
            blog: '博客',
            pulse: '动态',
            guide: '指南',
            submit: '提交',
            submitProject: '提交项目',
        },

        // 页脚
        footer: {
            tagline: 'OpenClaw 生态项目导航',
            curatedBy: 'JS 精选',
        },

        // 首页
        home: {
            pageTitle: 'JS ClawHub - OpenClaw 生态项目导航',
            metaDesc: 'JS 精选的 OpenClaw 生态项目导航站，发现技能、集成、教程与社区资源',
            curatedBadge: '// JS 精选',
            heroEcosystem: '生态',
            heroDesc: 'JS 精选的 OpenClaw 生态项目导航。发现技能、集成、教程与<span class="bg-black text-brand-yellow px-1">社区资源</span>。',
            searchPlaceholder: '搜索项目、技能、教程...',
            featured: '精选',
            categories: '分类',
            fromJs: '来自 JS',
            latestPulse: '最新动态',
            viewAll: '查看全部 →',
            statsProjects: '项目',
            statsSkills: '技能',
            statsIntegrations: '集成',
            statsTutorials: '教程',
        },

        // 博客
        blog: {
            pageTitle: '博客 - JS ClawHub',
            metaDesc: 'OpenClaw 生态教程、评测与技术分享',
            heroDesc: 'OpenClaw 生态教程、评测与<span class="bg-black text-brand-yellow px-1">技术分享</span>。',
            loadingPosts: '加载文章...',
            noPosts: '// 暂无文章',
            noPostsDesc: '文章即将上线，敬请期待。',
            errorTitle: '// 加载文章失败',
            errorDesc: '加载失败，请刷新页面重试。',
            loadingPost: '加载文章...',
            postNotFound: '// 文章未找到',
            browseAll: '浏览全部文章',
            backToBlog: '← 返回博客',
            postTitleSuffix: ' - JS ClawHub 博客',
            tags: {
                Announcement: '公告',
                Guide: '指南',
                OpenClaw: 'OpenClaw',
                Tutorial: '教程',
                Deployment: '部署',
            },
        },

        // 技能市场
        skills: {
            pageTitle: '技能市场 - JS ClawHub',
            metaDesc: '发现和探索 OpenClaw 社区技能，扩展你的 AI 助手能力',
            heroDesc: '发现和探索 OpenClaw 社区技能，扩展你的 AI 助手<span class="bg-black text-brand-yellow px-1">能力边界</span>。',
            searchPlaceholder: '搜索技能...',
            loadingSkills: '加载技能...',
            errorLoading: '// 加载技能失败',
            noSkillsInCategory: '// 该分类暂无技能',
            backToSkills: '← 返回技能市场',
            detailPageTitle: '技能详情 - JS ClawHub',
            detailMetaDesc: 'OpenClaw 技能详情',
            loadingDetail: '加载中...',
            docComingSoon: '// 详细文档即将上线',
            install: '安装',
            readyToInstall: '✓ 准备就绪，可安装',
            skillNotFound: '// 技能未找到',
            browseAllSkills: '浏览全部技能',
            source: '源码',
        },

        // 入门指南
        guide: {
            pageTitle: '入门指南 - JS ClawHub',
            heroTitle: '入门指南',
            metaDesc: 'OpenClaw 入门指南 - 从零开始配置你的个人 AI 助手',
            heroDesc: '从零开始配置你的 OpenClaw <span class="bg-black text-brand-yellow px-1">个人 AI 助手</span>。',
            toc: '目录',
            loadingGuide: '加载指南...',
            errorLoading: '// 加载指南失败',
            guideNotFound: '// 指南未找到',
            detailTitleSuffix: ' - 入门指南',
        },

        // Pulse
        pulse: {
            pageTitle: 'Pulse - JS ClawHub',
            metaDesc: 'OpenClaw 生态 X 热点速递，AI 筛选的社区动态',
            heroDesc: 'OpenClaw 生态<span class="bg-black text-brand-yellow px-1">X 热点速递</span>。AI 筛选，JS 策展。',
            loadingPulse: '加载动态...',
            noPulse: '// 暂无动态',
            noPulseDesc: 'Pulse 数据将在此显示。',
            errorTitle: '// 加载动态失败',
            errorDesc: '加载失败，请刷新页面。',
            items: '条',
            jsTake: 'JS_BESTAGENT 的看法',
            views: '浏览',
            bookmarks: '收藏',
            copied: '已复制',
            weekStats: '本周 {total} 条 · {authors} 位作者 · 均分 {score}',
            trending: '本周热门',
            filterAll: '全部',
            filterToday: '今天',
            filterYesterday: '昨天',
            filterLast7: '近 7 天',
            filterLast30: '近 30 天',
        },

        // Agent Skill
        agent: {
            title: '让你的 AI 助手认识 JS',
            instruction: '发送给你的 Agent：',
            command: '认识一下 JS ClawHub，读取 https://js-clawhub.com/skill.md',
            desc: '从此你的 Agent 多了一个懂 OpenClaw 生态的朋友。',
            copied: '已复制！',
        },

        // 搜索
        search: {
            noResults: '// 未找到结果',
        },

        // 通用
        common: {
            loading: '加载中...',
        },
    };

    window.I18nLocales['zh-CN'] = locale;
})();
