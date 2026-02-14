/**
 * English (US) Language Pack
 * JS ClawHub
 */
(function() {
    const locale = {
        // Navigation
        nav: {
            projects: 'PROJECTS',
            skills: 'SKILLS',
            blog: 'BLOG',
            pulse: 'PULSE',
            guide: 'GUIDE',
            submit: 'Submit',
            submitProject: 'SUBMIT PROJECT',
        },

        // Footer
        footer: {
            tagline: 'OpenClaw Ecosystem Navigation',
            curatedBy: 'Curated by JS',
        },

        // Homepage
        home: {
            pageTitle: 'JS ClawHub - OpenClaw Ecosystem Navigation',
            metaDesc: 'Curated OpenClaw ecosystem navigation by JS. Discover skills, integrations, tutorials & community resources.',
            curatedBadge: '// CURATED BY JS',
            heroEcosystem: 'Ecosystem',
            heroDesc: 'Curated OpenClaw ecosystem navigation by JS. Discover skills, integrations, tutorials & <span class="bg-black text-brand-yellow px-1">community resources</span>.',
            searchPlaceholder: 'Search projects, skills, tutorials...',
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

        // Blog
        blog: {
            pageTitle: 'Blog - JS ClawHub',
            metaDesc: 'OpenClaw ecosystem tutorials, reviews & tech sharing',
            heroDesc: 'OpenClaw ecosystem tutorials, reviews & <span class="bg-black text-brand-yellow px-1">tech sharing</span>.',
            loadingPosts: 'LOADING POSTS...',
            noPosts: '// NO POSTS YET',
            noPostsDesc: 'Posts are coming soon. Stay tuned.',
            errorTitle: '// ERROR LOADING POSTS',
            errorDesc: 'Failed to load. Please refresh the page.',
            loadingPost: 'LOADING POST...',
            postNotFound: '// POST NOT FOUND',
            browseAll: 'BROWSE ALL POSTS',
            backToBlog: '← BACK TO BLOG',
            postTitleSuffix: ' - JS ClawHub Blog',
            tags: {
                Announcement: 'Announcement',
                Guide: 'Guide',
                OpenClaw: 'OpenClaw',
                Tutorial: 'Tutorial',
                Deployment: 'Deployment',
            },
        },

        // Skills Market
        skills: {
            pageTitle: 'Skills Market - JS ClawHub',
            metaDesc: 'Discover and explore OpenClaw community skills to extend your AI assistant capabilities',
            heroDesc: 'Discover and explore OpenClaw community skills to extend your AI assistant\'s <span class="bg-black text-brand-yellow px-1">capabilities</span>.',
            searchPlaceholder: 'Search skills...',
            loadingSkills: 'LOADING SKILLS...',
            errorLoading: '// ERROR LOADING SKILLS',
            noSkillsInCategory: '// NO SKILLS IN THIS CATEGORY',
            backToSkills: '← BACK TO SKILLS',
            detailPageTitle: 'Skill Detail - JS ClawHub',
            detailMetaDesc: 'OpenClaw skill details',
            loadingDetail: 'LOADING...',
            docComingSoon: '// Detailed docs coming soon',
            install: 'Install',
            readyToInstall: '✓ Ready to install',
            skillNotFound: '// SKILL NOT FOUND',
            browseAllSkills: 'BROWSE ALL SKILLS',
            source: 'SOURCE',
        },

        // Getting Started Guide
        guide: {
            pageTitle: 'Getting Started - JS ClawHub',
            heroTitle: 'Guide',
            metaDesc: 'OpenClaw Getting Started Guide - Configure your personal AI assistant from scratch',
            heroDesc: 'Configure your OpenClaw <span class="bg-black text-brand-yellow px-1">personal AI assistant</span> from scratch.',
            toc: 'Contents',
            loadingGuide: 'LOADING GUIDE...',
            errorLoading: '// ERROR LOADING GUIDE',
            guideNotFound: '// GUIDE NOT FOUND',
            detailTitleSuffix: ' - Getting Started Guide',
        },

        // Pulse
        pulse: {
            pageTitle: 'Pulse - JS ClawHub',
            metaDesc: 'OpenClaw ecosystem X highlights, AI-curated community updates',
            heroDesc: 'OpenClaw ecosystem <span class="bg-black text-brand-yellow px-1">X highlights</span>. AI-curated, JS-selected.',
            loadingPulse: 'LOADING PULSE...',
            noPulse: '// NO PULSE YET',
            noPulseDesc: 'Run <code class="bg-black text-brand-yellow px-2 py-1 font-mono text-sm">npm run sync-pulse</code> to populate.',
            errorTitle: '// ERROR LOADING PULSE',
            errorDesc: 'Failed to load data. Please refresh.',
            items: 'items',
            jsTake: "JS's Take",
            views: 'Views',
            bookmarks: 'Bookmarks',
            weekStats: '{total} items · {authors} authors · avg {score}',
            trending: 'Trending This Week',
        },

        // Search
        search: {
            noResults: '// NO RESULTS FOUND',
        },

        // Common
        common: {
            loading: 'Loading...',
        },
    };

    window.I18nLocales['en-US'] = locale;
})();
