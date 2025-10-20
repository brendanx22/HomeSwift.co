import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CheckSquare,
  Square,
  Home,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Camera,
  FileText,
  Download,
  Share2,
  RefreshCw,
  Eye,
  Search,
  Filter,
  ClipboardList,
  Wrench,
  Zap,
  Droplets,
  Wind,
  TreePine,
  Car,
  Shield
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const HomeInspectionChecklist = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('checklist');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [checklistData, setChecklistData] = useState({});
  const [completedItems, setCompletedItems] = useState({});
  const [notes, setNotes] = useState({});
  const [savedReports, setSavedReports] = useState([]);

  useEffect(() => {
    if (isAuthenticated) {
      loadChecklistData();
      loadUserProgress();
      loadSavedReports();
    }
  }, [isAuthenticated]);

  const loadSavedReports = async () => {
    try {
      const { data: reports, error } = await supabase
        .from('home_inspection_reports')
        .select('*')
        .eq('inspector_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSavedReports(reports || []);
    } catch (error) {
      console.error('Error loading saved reports:', error);
    }
  };

  const saveInspectionReport = async (reportData) => {
    try {
      const { data, error } = await supabase
        .from('home_inspection_reports')
        .insert([
          {
            inspector_id: user.id,
            inspection_date: new Date().toISOString().split('T')[0],
            report_data: reportData,
            overall_condition: reportData.overallCondition,
            major_issues: reportData.majorIssues,
            estimated_repair_cost: reportData.totalCost,
            is_completed: true
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast.success('Inspection report saved!');
      loadSavedReports(); // Refresh saved reports
      return data;
    } catch (error) {
      console.error('Error saving inspection report:', error);
      toast.error('Failed to save inspection report');
      throw error;
    }
  };

  const loadChecklistData = async () => {
    try {
      // First check if we have data in the database
      const { data: existingData, error: fetchError } = await supabase
        .from('home_inspection_checklists')
        .select('*')
        .eq('is_active', true)
        .order('category_id', { ascending: true })
        .order('item_order', { ascending: true });

      if (fetchError) throw fetchError;

      if (existingData && existingData.length > 0) {
        // Transform database data into the expected format
        const formattedData = {};
        existingData.forEach(item => {
          if (!formattedData[item.category_id]) {
            formattedData[item.category_id] = {
              title: item.category_title,
              icon: getIconComponent(item.category_icon),
              color: item.category_color || 'blue',
              items: []
            };
          }

          formattedData[item.category_id].items.push({
            id: item.item_id,
            title: item.item_title,
            description: item.item_description,
            priority: item.item_priority || 'medium',
            estimatedCost: item.item_estimated_cost,
            tips: item.item_tips
          });
        });

        setChecklistData(formattedData);
        return;
      }

      // If no data exists, populate with initial data
      await populateInitialChecklistData();
    } catch (error) {
      console.error('Error loading checklist data:', error);
      toast.error('Failed to load inspection checklist');
    }
  };

  const populateInitialChecklistData = async () => {
    try {
      // Initial checklist data to populate the database
      const initialData = [
        // Exterior & Structure
        { category_id: 'exterior', category_title: 'Exterior & Structure', category_icon: 'Home', item_id: 'exterior_1', item_title: 'Foundation', item_description: 'Check for cracks, settling, or water damage', item_priority: 'high', item_estimated_cost: '$0-500', item_tips: 'Look for cracks wider than 1/4 inch, uneven settling, or signs of water intrusion', item_order: 1 },
        { category_id: 'exterior', category_title: 'Exterior & Structure', category_icon: 'Home', item_id: 'exterior_2', item_title: 'Roof Condition', item_description: 'Inspect shingles, gutters, and flashing', item_priority: 'high', item_estimated_cost: '$200-1000', item_tips: 'Check for missing shingles, damaged flashing, and proper gutter installation', item_order: 2 },
        { category_id: 'exterior', category_title: 'Exterior & Structure', category_icon: 'Home', item_id: 'exterior_3', item_title: 'Siding & Paint', item_description: 'Examine exterior walls and paint condition', item_priority: 'medium', item_estimated_cost: '$500-2000', item_tips: 'Look for peeling paint, rot, or damage that could lead to water intrusion', item_order: 3 },
        { category_id: 'exterior', category_title: 'Exterior & Structure', category_icon: 'Home', item_id: 'exterior_4', item_title: 'Windows & Doors', item_description: 'Check operation, seals, and weatherstripping', item_priority: 'medium', item_estimated_cost: '$100-300 per window', item_tips: 'Test all windows and doors for smooth operation and proper sealing', item_order: 4 },
        { category_id: 'exterior', category_title: 'Exterior & Structure', category_icon: 'Home', item_id: 'exterior_5', item_title: 'Driveway & Walkways', item_description: 'Inspect for cracks and proper drainage', item_priority: 'low', item_estimated_cost: '$200-1000', item_tips: 'Ensure proper slope away from foundation to prevent water damage', item_order: 5 },

        // Interior & Systems
        { category_id: 'interior', category_title: 'Interior & Systems', category_icon: 'Wrench', item_id: 'interior_1', item_title: 'Electrical System', item_description: 'Check outlets, switches, and panel', item_priority: 'high', item_estimated_cost: '$100-500', item_tips: 'Test all outlets and switches, check circuit breaker panel for proper labeling', item_order: 1 },
        { category_id: 'interior', category_title: 'Interior & Systems', category_icon: 'Wrench', item_id: 'interior_2', item_title: 'Plumbing System', item_description: 'Inspect pipes, fixtures, and water pressure', item_priority: 'high', item_estimated_cost: '$50-300', item_tips: 'Check for leaks, water pressure, and proper drainage in all fixtures', item_order: 2 },
        { category_id: 'interior', category_title: 'Interior & Systems', category_icon: 'Wrench', item_id: 'interior_3', item_title: 'HVAC System', item_description: 'Inspect heating and cooling systems', item_priority: 'high', item_estimated_cost: '$100-400', item_tips: 'Check air filters, thermostat operation, and overall system condition', item_order: 3 },
        { category_id: 'interior', category_title: 'Interior & Systems', category_icon: 'Wrench', item_id: 'interior_4', item_title: 'Insulation & Ventilation', item_description: 'Check attic and crawl space insulation', item_priority: 'medium', item_estimated_cost: '$200-800', item_tips: 'Ensure proper insulation levels and ventilation to prevent moisture issues', item_order: 4 },
        { category_id: 'interior', category_title: 'Interior & Systems', category_icon: 'Wrench', item_id: 'interior_5', item_title: 'Interior Walls & Ceilings', item_description: 'Check for cracks, stains, or damage', item_priority: 'medium', item_estimated_cost: '$100-400', item_tips: 'Look for water stains, cracks, or signs of structural issues', item_order: 5 },
        { category_id: 'interior', category_title: 'Interior & Systems', category_icon: 'Wrench', item_id: 'interior_6', item_title: 'Rental-Specific Items', item_description: 'Check landlord responsibilities and tenant rights', item_priority: 'high', item_estimated_cost: '$0-200', item_tips: 'Verify lease terms, check for required repairs, document existing damage', item_order: 6 },

        // Appliances & Fixtures
        { category_id: 'appliances', category_title: 'Appliances & Fixtures', category_icon: 'Zap', item_id: 'appliances_1', item_title: 'Kitchen Appliances', item_description: 'Test refrigerator, stove, dishwasher', item_priority: 'medium', item_estimated_cost: '$50-200 per appliance', item_tips: 'Check operation, age, and overall condition of all major appliances', item_order: 1 },
        { category_id: 'appliances', category_title: 'Appliances & Fixtures', category_icon: 'Zap', item_id: 'appliances_2', item_title: 'Laundry Equipment', item_description: 'Inspect washer and dryer', item_priority: 'medium', item_estimated_cost: '$100-300', item_tips: 'Check for proper installation, operation, and any signs of wear', item_order: 2 },
        { category_id: 'appliances', category_title: 'Appliances & Fixtures', category_icon: 'Zap', item_id: 'appliances_3', item_title: 'Water Heater', item_description: 'Check age, condition, and safety', item_priority: 'high', item_estimated_cost: '$500-1500', item_tips: 'Note age and capacity, check for proper venting and safety features', item_order: 3 },
        { category_id: 'appliances', category_title: 'Appliances & Fixtures', category_icon: 'Zap', item_id: 'appliances_4', item_title: 'Light Fixtures', item_description: 'Test all lighting throughout the home', item_priority: 'low', item_estimated_cost: '$20-100', item_tips: 'Ensure all fixtures work properly and are energy efficient', item_order: 4 },

        // Safety & Environmental
        { category_id: 'safety', category_title: 'Safety & Environmental', category_icon: 'Shield', item_id: 'safety_1', item_title: 'Smoke & CO Detectors', item_description: 'Check placement and operation', item_priority: 'critical', item_estimated_cost: '$20-100', item_tips: 'Ensure detectors are present on every level and tested regularly', item_order: 1 },
        { category_id: 'safety', category_title: 'Safety & Environmental', category_icon: 'Shield', item_id: 'safety_2', item_title: 'Radon Testing', item_description: 'Test for radon gas presence', item_priority: 'high', item_estimated_cost: '$100-200', item_tips: 'Consider professional radon testing in high-risk areas', item_order: 2 },
        { category_id: 'safety', category_title: 'Safety & Environmental', category_icon: 'Shield', item_id: 'safety_3', item_title: 'Lead Paint', item_description: 'Check for lead-based paint (pre-1978 homes)', item_priority: 'high', item_estimated_cost: '$200-500', item_tips: 'Professional testing required for homes built before 1978', item_order: 3 },
        { category_id: 'safety', category_title: 'Safety & Environmental', category_icon: 'Shield', item_id: 'safety_4', item_title: 'Mold & Mildew', item_description: 'Check for visible mold growth', item_priority: 'high', item_estimated_cost: '$300-1000', item_tips: 'Look for musty odors, visible mold, or signs of moisture problems', item_order: 4 }
      ];

      // Insert the initial data into the database
      const { error: insertError } = await supabase
        .from('home_inspection_checklists')
        .insert(initialData);

      if (insertError) throw insertError;

      // Now fetch the data we just inserted
      const { data: newData, error: fetchError } = await supabase
        .from('home_inspection_checklists')
        .select('*')
        .eq('is_active', true)
        .order('category_id', { ascending: true })
        .order('item_order', { ascending: true });

      if (fetchError) throw fetchError;

      // Transform into the expected format
      const formattedData = {};
      newData.forEach(item => {
        if (!formattedData[item.category_id]) {
          formattedData[item.category_id] = {
            title: item.category_title,
            icon: getIconComponent(item.category_icon),
            color: item.category_color || 'blue',
            items: []
          };
        }

        formattedData[item.category_id].items.push({
          id: item.item_id,
          title: item.item_title,
          description: item.item_description,
          priority: item.item_priority || 'medium',
          estimatedCost: item.item_estimated_cost,
          tips: item.item_tips
        });
      });

      setChecklistData(formattedData);
      toast.success('Inspection checklist loaded successfully!');
    } catch (error) {
      console.error('Error populating checklist data:', error);
      toast.error('Failed to initialize inspection checklist');
    }
  };

  const getIconComponent = (iconName) => {
    const iconMap = {
      'Home': Home,
      'Wrench': Wrench,
      'Zap': Zap,
      'Shield': Shield,
      'ClipboardList': ClipboardList,
      'CheckSquare': CheckSquare,
      'FileText': FileText
    };
    return iconMap[iconName] || Home;
  };

  const loadUserProgress = async () => {
    try {
      // Load user progress from database
      const { data: progressData, error: progressError } = await supabase
        .from('user_inspection_progress')
        .select('*')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      // Transform database data into the expected format
      const formattedProgress = {};
      if (progressData && progressData.length > 0) {
        progressData.forEach(item => {
          formattedProgress[item.checklist_item_id] = {
            completed: item.completed,
            notes: item.notes || '',
            photos: item.photos || [],
            completed_at: item.completed_at
          };
        });
      }

      setCompletedItems(formattedProgress);
    } catch (error) {
      console.error('Error loading user progress:', error);
      // Fallback to empty progress if database query fails
      setCompletedItems({});
    }
  };

  const handleItemToggle = async (itemId) => {
    const isCompleted = !completedItems[itemId]?.completed;

    // Update local state immediately for responsive UI
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : prev[itemId]?.completed_at
      }
    }));

    try {
      // Save to database
      const { error } = await supabase
        .from('user_inspection_progress')
        .upsert({
          user_id: user.id,
          checklist_item_id: itemId,
          completed: isCompleted,
          completed_at: isCompleted ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,checklist_item_id'
        });

      if (error) throw error;

      toast.success(isCompleted ? 'Item marked as completed!' : 'Item marked as incomplete');
    } catch (error) {
      console.error('Error saving progress:', error);
      toast.error('Failed to save progress');
      // Revert local state on error
      setCompletedItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          completed: !isCompleted
        }
      }));
    }
  };

  const handleNotesChange = async (itemId, note) => {
    // Update local state immediately for responsive UI
    setNotes(prev => ({
      ...prev,
      [itemId]: note
    }));
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        notes: note
      }
    }));

    try {
      // Save to database
      const { error } = await supabase
        .from('user_inspection_progress')
        .upsert({
          user_id: user.id,
          checklist_item_id: itemId,
          notes: note,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,checklist_item_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes');
    }
  };

  const handlePhotoAdd = async (itemId, photo) => {
    const currentPhotos = completedItems[itemId]?.photos || [];

    // Update local state immediately for responsive UI
    const updatedPhotos = [...currentPhotos, photo];
    setCompletedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        photos: updatedPhotos
      }
    }));

    try {
      // Save to database
      const { error } = await supabase
        .from('user_inspection_progress')
        .upsert({
          user_id: user.id,
          checklist_item_id: itemId,
          photos: updatedPhotos,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,checklist_item_id'
        });

      if (error) throw error;

      toast.success('Photo added successfully!');
    } catch (error) {
      console.error('Error saving photo:', error);
      toast.error('Failed to save photo');
      // Revert local state on error
      setCompletedItems(prev => ({
        ...prev,
        [itemId]: {
          ...prev[itemId],
          photos: currentPhotos
        }
      }));
    }
  };

  const generateInspectionReport = async () => {
    try {
      const stats = getCompletionStats();
      const completedItemsData = Object.entries(completedItems)
        .filter(([_, item]) => item.completed)
        .map(([itemId, item]) => {
          const checklistItem = Object.values(checklistData)
            .flatMap(cat => cat.items)
            .find(item => item.id === itemId);
          return {
            id: itemId,
            title: checklistItem?.title || 'Unknown Item',
            category: checklistItem?.category || 'Unknown',
            notes: item.notes || '',
            photos: item.photos || []
          };
        });

      const reportData = {
        overallCondition: stats.percentage >= 80 ? 'excellent' : stats.percentage >= 60 ? 'good' : stats.percentage >= 40 ? 'fair' : 'poor',
        completedItems: completedItemsData,
        totalItems: stats.total,
        completionPercentage: stats.percentage,
        totalCost: completedItemsData.reduce((sum, item) => {
          const checklistItem = Object.values(checklistData)
            .flatMap(cat => cat.items)
            .find(i => i.id === item.id);
          return sum + (checklistItem?.estimatedCost ? parseInt(checklistItem.estimatedCost.replace(/[$,]/g, '')) : 0);
        }, 0),
        majorIssues: completedItemsData.filter(item => {
          const checklistItem = Object.values(checklistData)
            .flatMap(cat => cat.items)
            .find(i => i.id === item.id);
          return checklistItem?.priority === 'critical' || checklistItem?.priority === 'high';
        }),
        createdAt: new Date().toISOString()
      };

      await saveInspectionReport(reportData);
      toast.success('Inspection report generated and saved!');
    } catch (error) {
      toast.error('Failed to generate inspection report');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCompletionStats = () => {
    const allItems = Object.values(checklistData).flatMap(category => category.items);
    const total = allItems.length;
    const completed = Object.values(completedItems).filter(item => item.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      percentage
    };
  };

  const stats = getCompletionStats();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ClipboardList className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to use the home inspection checklist</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Home Inspection Checklist</h1>
                <p className="text-gray-600">Comprehensive guide for home inspections and property assessments</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm text-gray-600">Progress</div>
                <div className="text-2xl font-bold text-[#FF6B35]">
                  {stats.percentage}%
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-8">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'checklist', label: 'Inspection Checklist', icon: ClipboardList },
                { id: 'progress', label: 'My Progress', icon: CheckSquare },
                { id: 'reports', label: 'Inspection Reports', icon: FileText }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-[#FF6B35] text-[#FF6B35]'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Checklist Tab */}
        {activeTab === 'checklist' && (
          <div className="space-y-8">
            {/* Progress Overview */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Inspection Progress</h3>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">{stats.completed}</div>
                  <div className="text-sm text-gray-600">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-600 mb-2">{stats.total - stats.completed}</div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">{stats.percentage}%</div>
                  <div className="text-sm text-gray-600">Complete</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {Object.values(checklistData).length}
                  </div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-medium">Overall Progress</span>
                  <span className="text-gray-600">{stats.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-[#FF6B35] to-orange-500 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${stats.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Filters and Search */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Search inspection items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full md:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>

                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="all">All Categories</option>
                    {Object.entries(checklistData).map(([id, category]) => (
                      <option key={id} value={id}>{category.title}</option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-600">Filter by priority:</span>
                  <select className="px-3 py-1 border border-gray-300 rounded text-sm">
                    <option>All Priorities</option>
                    <option>Critical</option>
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Category Sections */}
            {Object.entries(checklistData).map(([categoryId, category]) => {
              const CategoryIcon = category.icon;
              const categoryItems = category.items.filter(item =>
                item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.description.toLowerCase().includes(searchTerm.toLowerCase())
              );

              if (categoryItems.length === 0) return null;

              return (
                <div key={categoryId} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <CategoryIcon className="w-5 h-5 text-gray-600" />
                      <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        {categoryItems.length} items
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {categoryItems.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start space-x-4">
                          <button
                            onClick={() => handleItemToggle(item.id)}
                            className="flex-shrink-0 mt-1"
                          >
                            {completedItems[item.id]?.completed ? (
                              <CheckSquare className="w-5 h-5 text-green-500" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </button>

                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className={`font-medium ${completedItems[item.id]?.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                  {item.title}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                              </div>

                              <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                                {item.priority}
                              </span>
                            </div>

                            {/* Tips */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                              <div className="text-sm text-blue-800">
                                <strong>Tips:</strong> {item.tips}
                              </div>
                            </div>

                            {/* Notes */}
                            <div className="mb-3">
                              <textarea
                                placeholder="Add your notes here..."
                                value={notes[item.id] || completedItems[item.id]?.notes || ''}
                                onChange={(e) => handleNotesChange(item.id, e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent text-sm"
                                rows={2}
                              />
                            </div>

                            {/* Photo upload */}
                            <div className="flex items-center space-x-2">
                              <button className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                <Camera className="w-4 h-4" />
                                <span className="text-sm">Add Photo</span>
                              </button>

                              {completedItems[item.id]?.photos?.length > 0 && (
                                <span className="text-sm text-gray-600">
                                  {completedItems[item.id].photos.length} photo(s) added
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && (
          <div className="space-y-8">
            {/* Overall Progress */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Your Progress</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(checklistData).map(([categoryId, category]) => {
                  const categoryItems = category.items;
                  const completedCount = categoryItems.filter(item => completedItems[item.id]?.completed).length;
                  const percentage = Math.round((completedCount / categoryItems.length) * 100);

                  return (
                    <div key={categoryId} className="text-center p-4 border border-gray-200 rounded-lg">
                      <div className="text-2xl font-bold text-[#FF6B35] mb-2">{percentage}%</div>
                      <div className="text-sm text-gray-600 mb-2">{category.title}</div>
                      <div className="text-xs text-gray-500">{completedCount}/{categoryItems.length} completed</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Completed Items */}
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Completed Items</h3>

              {Object.entries(completedItems).filter(([_, item]) => item.completed).length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No items completed yet. Start your inspection!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(completedItems)
                    .filter(([_, item]) => item.completed)
                    .map(([itemId, item]) => {
                      const checklistItem = Object.values(checklistData)
                        .flatMap(cat => cat.items)
                        .find(item => item.id === itemId);

                      if (!checklistItem) return null;

                      return (
                        <div key={itemId} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                          <div>
                            <div className="font-medium text-green-800">{checklistItem.title}</div>
                            <div className="text-sm text-green-600">{item.notes}</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {item.photos?.length > 0 && (
                              <span className="text-sm text-green-600">{item.photos.length} photos</span>
                            )}
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-8">
            <div className="bg-white rounded-lg p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Inspection Reports</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <button
                  onClick={generateInspectionReport}
                  className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#FF6B35] hover:bg-orange-50 transition-colors text-center"
                >
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="font-medium text-gray-900 mb-1">Generate PDF Report</div>
                  <div className="text-sm text-gray-600">Complete inspection summary</div>
                </button>

                <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#FF6B35] hover:bg-orange-50 transition-colors text-center">
                  <Download className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="font-medium text-gray-900 mb-1">Export Checklist</div>
                  <div className="text-sm text-gray-600">Download for offline use</div>
                </button>

                <button className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-[#FF6B35] hover:bg-orange-50 transition-colors text-center">
                  <Share2 className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <div className="font-medium text-gray-900 mb-1">Share Progress</div>
                  <div className="text-sm text-gray-600">Send to real estate agent</div>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default HomeInspectionChecklist;
