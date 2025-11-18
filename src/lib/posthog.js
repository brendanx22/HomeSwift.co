import posthog from 'posthog-js';

let isInitialized = false;

// Initialize PostHog
export const initPostHog = () => {
  if (isInitialized || typeof window === 'undefined' || !import.meta.env.VITE_POSTHOG_KEY) {
    return;
  }

  try {
    posthog.init(
      import.meta.env.VITE_POSTHOG_KEY,
      {
        api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
        cross_origin_support: true, // Enable cross-origin support
        loaded: (posthog) => {
          if (import.meta.env.DEV) {
            posthog.debug(); // Enable debug mode in development
            console.log('PostHog debug mode enabled');
          }
        },
        capture_pageview: true,
        capture_pageleave: true,
        autocapture: {
          url_allowlist: ['homeswift.co', 'www.homeswift.co'],
          cors_safelist: ['homeswift.co', 'www.homeswift.co'],
        },
        session_recording: {
          recordCrossOriginIframes: true,
          cross_origin_iframe: true,
        },
        persistence: 'localStorage',
        disable_session_recording: import.meta.env.DEV, // Disable session recording in dev
        disable_persistence: import.meta.env.TEST, // Disable persistence in test env
        opt_out_capturing_by_default: import.meta.env.DEV, // Opt out by default in dev
        secure_cookie: true,
        cross_subdomain_cookie: true,
        cookie_domain: '.homeswift.co',
        ui_host: 'app.posthog.com',
        save_referrer: true,
        property_blacklist: ['$current_url', '$pathname', '$host'],
      }
    );
    
    isInitialized = true;
    console.log('PostHog initialized successfully');
  } catch (error) {
    console.error('Failed to initialize PostHog:', error);
  }
};

// Track custom events
export const trackEvent = (eventName, properties = {}) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture(eventName, properties);
  }
};

// Identify user
export const identifyUser = (userId, userProperties = {}) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.identify(userId, userProperties);
  }
};

// Reset user (on logout)
export const resetUser = () => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.reset();
  }
};

// Track page view
export const trackPageView = (pageName, properties = {}) => {
  if (typeof window !== 'undefined' && posthog) {
    posthog.capture('$pageview', {
      page_name: pageName,
      ...properties,
    });
  }
};

// Track message sent
export const trackMessageSent = (messageData) => {
  trackEvent('message_sent', {
    message_length: messageData.content?.length || 0,
    has_attachments: !!messageData.attachments,
    conversation_id: messageData.conversationId,
    user_role: messageData.userRole,
  });
};

// Track listing viewed
export const trackListingViewed = (listingData) => {
  trackEvent('listing_viewed', {
    listing_id: listingData.id,
    listing_title: listingData.title,
    price: listingData.price,
    location: listingData.location,
    property_type: listingData.property_type,
  });
};

// Track listing created
export const trackListingCreated = (listingData) => {
  trackEvent('listing_created', {
    listing_id: listingData.id,
    price: listingData.price,
    property_type: listingData.property_type,
    location: listingData.location,
  });
};

// Track search performed
export const trackSearch = (searchData) => {
  trackEvent('search_performed', {
    query: searchData.query,
    filters: searchData.filters,
    results_count: searchData.resultsCount,
  });
};

// Track user signup
export const trackSignup = (userData) => {
  trackEvent('user_signup', {
    user_type: userData.userType,
    signup_method: userData.method, // 'google' or 'email'
  });
};

// Track user login
export const trackLogin = (userData) => {
  trackEvent('user_login', {
    user_type: userData.userType,
    login_method: userData.method,
  });
};

// Track role switch
export const trackRoleSwitch = (fromRole, toRole) => {
  trackEvent('role_switched', {
    from_role: fromRole,
    to_role: toRole,
  });
};

// Track application submitted
export const trackApplicationSubmitted = (applicationData) => {
  trackEvent('application_submitted', {
    listing_id: applicationData.listingId,
    listing_title: applicationData.listingTitle,
  });
};

// Track profile updated
export const trackProfileUpdated = (updateType) => {
  trackEvent('profile_updated', {
    update_type: updateType,
  });
};

export default posthog;
