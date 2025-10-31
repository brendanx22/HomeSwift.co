import posthog from 'posthog-js';

// Initialize PostHog
export const initPostHog = () => {
  if (typeof window !== 'undefined') {
    posthog.init(
      import.meta.env.VITE_POSTHOG_KEY || 'phc_your_project_api_key',
      {
        api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://app.posthog.com',
        loaded: (posthog) => {
          if (import.meta.env.MODE === 'development') {
            console.log('PostHog loaded successfully');
          }
        },
        capture_pageview: true, // Automatically capture pageviews
        capture_pageleave: true, // Capture when users leave pages
        autocapture: true, // Automatically capture clicks and form submissions
        session_recording: {
          recordCrossOriginIframes: true,
        },
      }
    );
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
