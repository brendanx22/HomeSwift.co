import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

const DashboardContext = createContext();

export const DashboardProvider = ({ children }) => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalListings: 0,
    totalViews: 0,
    activeRentals: 0,
    propertiesSold: 0,
    activeLeads: 0,
    inquiries: 0
  });

  // Fetch properties from Supabase
  const fetchProperties = async () => {
    try {
      setLoading(true);
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('No authenticated user, skipping property fetch');
        setProperties([]);
        updateStats([]);
        return [];
      }

      const { data, error } = await supabase
        .from('properties')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setProperties(data || []);
      updateStats(data || []);
      return data || [];
    } catch (error) {
      console.error('Error fetching properties:', error);
      setProperties([]);
      updateStats([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Update dashboard statistics
  const updateStats = (properties) => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const recentProperties = properties.filter(
      p => new Date(p.created_at) > lastWeek
    );

    setStats({
      totalListings: properties.length,
      totalViews: properties.reduce((sum, p) => sum + (p.views || 0), 0),
      activeRentals: properties.filter(p => p.status === 'active').length,
      propertiesSold: properties.filter(p => p.status === 'sold').length,
      activeLeads: 0, // This would come from a leads table
      inquiries: 0    // This would come from a messages/inquiries table
    });
  };

  // Get recent properties (last 7 days)
  const getRecentProperties = () => {
    const lastWeek = new Date();
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return properties.filter(
      property => new Date(property.created_at) > lastWeek
    );
  };

  // Add a new property
  const addProperty = async (propertyData) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('properties')
        .insert([{ ...propertyData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchProperties(); // Refresh the properties list
      return { data, error: null };
    } catch (error) {
      console.error('Error adding property:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Update a property
  const updateProperty = async (id, updates) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('properties')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      
      await fetchProperties(); // Refresh the properties list
      return { data, error: null };
    } catch (error) {
      console.error('Error updating property:', error);
      return { data: null, error };
    } finally {
      setLoading(false);
    }
  };

  // Delete a property
  const removeProperty = async (id) => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('properties')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchProperties(); // Refresh the properties list
      return { error: null };
    } catch (error) {
      console.error('Error deleting property:', error);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchProperties();
    
    // Set up real-time subscription
    const subscription = supabase
      .channel('properties')
      .on('postgres_changes', 
        { 
          event: '*',
          schema: 'public',
          table: 'properties'
        }, 
        (payload) => {
          fetchProperties(); // Refresh when properties change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <DashboardContext.Provider
      value={{
        properties,
        loading,
        stats,
        fetchProperties,
        addProperty,
        updateProperty,
        removeProperty,
        getRecentProperties
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

// Custom hook to use the dashboard context
export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};

export default DashboardContext;
