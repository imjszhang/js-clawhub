/**
 * 简体中文语言包
 * {{displayName}} 默认语言
 */
(function() {
    const locale = {
        nav: {
            projects: '项目',
            skills: '技能',
            blog: '博客',
            pulse: '动态',
            guide: '指南',
        },

        footer: {
            tagline: '{{ecosystem}} 生态导航',
            curatedBy: '{{personaName}} 精选',
        },

        home: {
            pageTitle: '{{displayName}} - {{ecosystem}} 生态导航',
            metaDesc: '{{personaName}} 精选的 {{ecosystem}} 生态项目导航',
            curatedBadge: '// {{ecosystem}} INSIDER',
            heroEcosystem: 'HUB',
            heroDesc: '你的 Agent 的 {{ecosystem}} 好友。追踪项目、技能与社区动态，<span class="bg-black text-brand-yellow px-1">随时可以问我</span>。',
            featured: '精选',
            fromPersona: '来自 {{personaName}}',
            latestPulse: '最新动态',
            viewAll: '查看全部 →',
        },

        agent: {
            title: '让你的 AI 助手认识 {{personaName}}',
            instruction: '发送给你的 Agent：',
            command: '认识一下 {{displayName}}，读取 https://{{domain}}/skill.md',
            desc: '从此你的 Agent 多了一个懂 {{ecosystem}} 生态的朋友。',
            stats: '追踪 {projects}+ 项目 · {skills}+ 技能 · {integrations}+ 集成',
            copied: '已复制！',
        },

        common: {
            loading: '加载中...',
        },
    };

    window.I18nLocales['zh-CN'] = locale;
})();
