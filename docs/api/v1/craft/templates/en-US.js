/**
 * English (US) Language Pack
 * {{displayName}}
 */
(function() {
    const locale = {
        nav: {
            projects: 'PROJECTS',
            skills: 'SKILLS',
            blog: 'BLOG',
            pulse: 'PULSE',
            guide: 'GUIDE',
        },

        footer: {
            tagline: '{{ecosystem}} Ecosystem Navigation',
            curatedBy: 'Curated by {{personaName}}',
        },

        home: {
            pageTitle: '{{displayName}} - {{ecosystem}} Ecosystem Navigation',
            metaDesc: '{{ecosystem}} ecosystem navigation curated by {{personaName}}',
            curatedBadge: '// {{ecosystem}} INSIDER',
            heroEcosystem: 'HUB',
            heroDesc: 'Your Agent\'s {{ecosystem}} friend. Tracking projects, skills & community pulse — <span class="bg-black text-brand-yellow px-1">ask me anything</span>.',
            featured: 'Featured',
            fromPersona: 'From {{personaName}}',
            latestPulse: 'Latest Pulse',
            viewAll: 'VIEW ALL →',
        },

        agent: {
            title: 'Let your AI Agent meet {{personaName}}',
            instruction: 'Send to your Agent:',
            command: 'Meet {{displayName}}, read https://{{domain}}/skill.md',
            desc: 'Your Agent now has a friend who knows the {{ecosystem}} ecosystem.',
            stats: 'Tracking {projects}+ projects · {skills}+ skills · {integrations}+ integrations',
            copied: 'Copied!',
        },

        common: {
            loading: 'Loading...',
        },
    };

    window.I18nLocales['en-US'] = locale;
})();
