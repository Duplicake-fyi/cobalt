const getRuntimeConfig = () => {
    if (typeof window === 'undefined') {
        return {};
    }

    return window.__COBALT_RUNTIME_CONFIG__ ?? {};
};

export const getCustomLogoPath = () => {
    const customLogoPath = getRuntimeConfig().customLogoPath;
    return customLogoPath && customLogoPath.length > 0 ? customLogoPath : null;
};
