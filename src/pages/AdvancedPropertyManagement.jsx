import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Building,
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  Mail,
  MessageSquare,
  Edit,
  Trash2,
  Plus,
  Filter,
  Search,
  Download,
  Upload,
  Eye,
  Settings as SettingsIcon,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Award,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';

const AdvancedPropertyManagement = () => {
  const { user, isAuthenticated } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [properties, setProperties] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [maintenance, setMaintenance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddTenant, setShowAddTenant] = useState(false);
  const [showScheduleMaintenance, setShowScheduleMaintenance] = useState(false);

  // Tenant form state
  const [tenantForm, setTenantForm] = useState({
    name: '',
    email: '',
    phone: '',
    propertyId: '',
    moveInDate: '',
    leaseTerm: 12,
    monthlyRent: '',
    securityDeposit: '',
    notes: ''
  });

  // Maintenance form state
  const [maintenanceForm, setMaintenanceForm] = useState({
    propertyId: '',
    type: 'repair',
    priority: 'medium',
    description: '',
    estimatedCost: '',
    scheduledDate: '',
    assignedTo: '',
    notes: ''
  });

  useEffect(() => {
    if (isAuthenticated && user?.user_type === 'landlord') {
      loadPropertyData();
    }
  }, [isAuthenticated, user]);

  const loadPropertyData = async () => {
    try {
      setLoading(true);

      // Load properties from database
      const { data: propertiesData, error: propertiesError } = await supabase
        .from('properties')
        .select(`
          id,
          title,
          location,
          bedrooms,
          bathrooms,
          area,
          price,
          property_type,
          listing_type,
          is_featured,
          created_at,
          user_id
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (propertiesError) throw propertiesError;

      // Transform properties into management format
      const transformedProperties = propertiesData?.map(property => ({
        id: property.id,
        title: property.title || 'Untitled Property',
        location: property.location || 'Location not specified',
        units: property.bedrooms || 1, // Use bedrooms as units for now
        occupied: Math.floor(Math.random() * (property.bedrooms || 1)), // Mock occupancy for demo
        vacant: (property.bedrooms || 1) - Math.floor(Math.random() * (property.bedrooms || 1)),
        monthlyRevenue: (property.price || 0) * 0.8, // 80% of property value as revenue estimate
        occupancyRate: Math.floor(Math.random() * 30) + 70, // Mock occupancy rate
        status: 'active',
        lastMaintenance: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        nextInspection: new Date(Date.now() + Math.random() * 60 * 24 * 60 * 60 * 1000),
        issues: Math.floor(Math.random() * 5),
        tenants: Math.floor(Math.random() * (property.bedrooms || 1))
      })) || [];

      // For demo purposes, if no properties exist, create some mock ones
      if (transformedProperties.length === 0) {
        const mockProperties = [
          {
            id: 1,
            title: 'Luxury Apartment Complex',
            location: 'Victoria Island, Lagos',
            units: 20,
            occupied: 18,
            vacant: 2,
            monthlyRevenue: 4500000,
            occupancyRate: 90,
            status: 'active',
            lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
            nextInspection: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
            issues: 2,
            tenants: 18
          },
          {
            id: 2,
            title: 'Commercial Office Building',
            location: 'Ikoyi, Lagos',
            units: 15,
            occupied: 12,
            vacant: 3,
            monthlyRevenue: 6800000,
            occupancyRate: 80,
            status: 'active',
            lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
            nextInspection: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
            issues: 1,
            tenants: 12
          }
        ];
        setProperties(mockProperties);
      } else {
        setProperties(transformedProperties);
      }

      // Load tenants (for now, use mock data but could be extended with a tenants table)
      const mockTenants = [
        {
          id: 1,
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+234 801 234 5678',
          propertyId: transformedProperties[0]?.id || 1,
          unit: 'A101',
          moveInDate: new Date('2024-01-15'),
          leaseEndDate: new Date('2025-01-14'),
          monthlyRent: 250000,
          securityDeposit: 500000,
          status: 'active',
          paymentHistory: 'excellent',
          lastPayment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '+234 801 345 6789',
          propertyId: transformedProperties[0]?.id || 1,
          unit: 'B205',
          moveInDate: new Date('2024-03-01'),
          leaseEndDate: new Date('2025-02-28'),
          monthlyRent: 300000,
          securityDeposit: 600000,
          status: 'active',
          paymentHistory: 'good',
          lastPayment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        }
      ];

      setTenants(mockTenants);

      // Load maintenance data (mock for now, could be extended with maintenance table)
      const mockMaintenance = [
        {
          id: 1,
          propertyId: transformedProperties[0]?.id || 1,
          type: 'repair',
          priority: 'high',
          description: 'Leaking faucet in unit A101',
          status: 'in-progress',
          estimatedCost: 25000,
          scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
          assignedTo: 'Maintenance Team A',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          notes: 'Tenant reported water damage on floor'
        },
        {
          id: 2,
          propertyId: transformedProperties[1]?.id || 2,
          type: 'inspection',
          priority: 'medium',
          description: 'Monthly property inspection',
          status: 'scheduled',
          estimatedCost: 0,
          scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          assignedTo: 'Inspector John',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          notes: 'Regular monthly inspection'
        }
      ];

      setMaintenance(mockMaintenance);
    } catch (error) {
      console.error('Error loading property data:', error);
      toast.error('Failed to load property management data');

      // Fallback to original mock data
      const mockProperties = [
        {
          id: 1,
          title: 'Luxury Apartment Complex',
          location: 'Victoria Island, Lagos',
          units: 20,
          occupied: 18,
          vacant: 2,
          monthlyRevenue: 4500000,
          occupancyRate: 90,
          status: 'active',
          lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7),
          nextInspection: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
          issues: 2,
          tenants: 18
        },
        {
          id: 2,
          title: 'Commercial Office Building',
          location: 'Ikoyi, Lagos',
          units: 15,
          occupied: 12,
          vacant: 3,
          monthlyRevenue: 6800000,
          occupancyRate: 80,
          status: 'active',
          lastMaintenance: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14),
          nextInspection: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15),
          issues: 1,
          tenants: 12
        }
      ];

      const mockTenants = [
        {
          id: 1,
          name: 'John Smith',
          email: 'john.smith@email.com',
          phone: '+234 801 234 5678',
          propertyId: 1,
          unit: 'A101',
          moveInDate: new Date('2024-01-15'),
          leaseEndDate: new Date('2025-01-14'),
          monthlyRent: 250000,
          securityDeposit: 500000,
          status: 'active',
          paymentHistory: 'excellent',
          lastPayment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5)
        },
        {
          id: 2,
          name: 'Sarah Johnson',
          email: 'sarah.j@email.com',
          phone: '+234 801 345 6789',
          propertyId: 1,
          unit: 'B205',
          moveInDate: new Date('2024-03-01'),
          leaseEndDate: new Date('2025-02-28'),
          monthlyRent: 300000,
          securityDeposit: 600000,
          status: 'active',
          paymentHistory: 'good',
          lastPayment: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2)
        }
      ];

      const mockMaintenance = [
        {
          id: 1,
          propertyId: 1,
          type: 'repair',
          priority: 'high',
          description: 'Leaking faucet in unit A101',
          status: 'in-progress',
          estimatedCost: 25000,
          scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24),
          assignedTo: 'Maintenance Team A',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2),
          notes: 'Tenant reported water damage on floor'
        },
        {
          id: 2,
          propertyId: 2,
          type: 'inspection',
          priority: 'medium',
          description: 'Monthly property inspection',
          status: 'scheduled',
          estimatedCost: 0,
          scheduledDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
          assignedTo: 'Inspector John',
          createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5),
          notes: 'Regular monthly inspection'
        }
      ];

      setProperties(mockProperties);
      setTenants(mockTenants);
      setMaintenance(mockMaintenance);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTenant = async () => {
    try {
      if (!tenantForm.name.trim() || !tenantForm.email.trim() || !tenantForm.propertyId) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newTenant = {
        id: Date.now(),
        ...tenantForm,
        status: 'active',
        paymentHistory: 'new',
        createdAt: new Date()
      };

      setTenants(prev => [...prev, newTenant]);
      setShowAddTenant(false);

      // Reset form
      setTenantForm({
        name: '',
        email: '',
        phone: '',
        propertyId: '',
        moveInDate: '',
        leaseTerm: 12,
        monthlyRent: '',
        securityDeposit: '',
        notes: ''
      });

      toast.success('Tenant added successfully!');
    } catch (error) {
      console.error('Error adding tenant:', error);
      toast.error('Failed to add tenant');
    }
  };

  const handleScheduleMaintenance = async () => {
    try {
      if (!maintenanceForm.description.trim() || !maintenanceForm.propertyId) {
        toast.error('Please fill in all required fields');
        return;
      }

      const newMaintenance = {
        id: Date.now(),
        ...maintenanceForm,
        status: 'scheduled',
        createdAt: new Date()
      };

      setMaintenance(prev => [...prev, newMaintenance]);
      setShowScheduleMaintenance(false);

      // Reset form
      setMaintenanceForm({
        propertyId: '',
        type: 'repair',
        priority: 'medium',
        description: '',
        estimatedCost: '',
        scheduledDate: '',
        assignedTo: '',
        notes: ''
      });

      toast.success('Maintenance scheduled successfully!');
    } catch (error) {
      console.error('Error scheduling maintenance:', error);
      toast.error('Failed to schedule maintenance');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'completed': return 'text-blue-600 bg-blue-100';
      case 'overdue': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (!isAuthenticated || user?.user_type !== 'landlord') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Landlord Access Required</h2>
          <p className="text-gray-600 mb-6">This dashboard is only available for property owners</p>
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
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Management</h1>
                <p className="text-gray-600">Manage your properties, tenants, and maintenance</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddTenant(true)}
                className="flex items-center space-x-2 bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
              >
                <Users className="w-4 h-4" />
                <span>Add Tenant</span>
              </button>

              <button
                onClick={() => setShowScheduleMaintenance(true)}
                className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
              >
                <SettingsIcon className="w-4 h-4" />
                <span>Schedule Maintenance</span>
              </button>
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
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'properties', label: 'Properties', icon: Building },
                { id: 'tenants', label: 'Tenants', icon: Users },
                { id: 'maintenance', label: 'Maintenance', icon: SettingsIcon },
                { id: 'financial', label: 'Financial', icon: DollarSign },
                { id: 'reports', label: 'Reports', icon: PieChart }
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

        {/* Content */}
        <div className="space-y-8">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  title: 'Total Properties',
                  value: properties.length.toString(),
                  icon: Building,
                  color: 'text-blue-600',
                  bg: 'bg-blue-100'
                },
                {
                  title: 'Active Tenants',
                  value: tenants.length.toString(),
                  icon: Users,
                  color: 'text-green-600',
                  bg: 'bg-green-100'
                },
                {
                  title: 'Monthly Revenue',
                  value: formatCurrency(properties.reduce((sum, p) => sum + p.monthlyRevenue, 0)),
                  icon: DollarSign,
                  color: 'text-purple-600',
                  bg: 'bg-purple-100'
                },
                {
                  title: 'Pending Maintenance',
                  value: maintenance.filter(m => m.status === 'pending').length.toString(),
                  icon: AlertTriangle,
                  color: 'text-red-600',
                  bg: 'bg-red-100'
                }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white rounded-lg p-6 shadow-sm border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${stat.bg}`}>
                      <stat.icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Properties Tab */}
          {activeTab === 'properties' && (
            <div className="space-y-6">
              {properties.map((property) => (
                <motion.div
                  key={property.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{property.title}</h3>
                      <p className="text-sm text-gray-600">{property.location}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(property.status)}`}>
                        {property.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">{property.units}</div>
                      <div className="text-sm text-gray-600">Total Units</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">{property.occupancyRate}%</div>
                      <div className="text-sm text-gray-600">Occupancy</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">{formatCurrency(property.monthlyRevenue)}</div>
                      <div className="text-sm text-gray-600">Monthly Revenue</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-red-600">{property.issues}</div>
                      <div className="text-sm text-gray-600">Open Issues</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Active Tenants</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tenant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rent</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {tenants.map((tenant) => (
                        <tr key={tenant.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="font-medium text-gray-900">{tenant.name}</div>
                              <div className="text-sm text-gray-500">{tenant.email}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tenant.unit}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(tenant.monthlyRent)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(tenant.status)}`}>
                              {tenant.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-800">
                                <MessageSquare className="w-4 h-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-800">
                                <Phone className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Maintenance Tab */}
          {activeTab === 'maintenance' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Maintenance Requests</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scheduled</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {maintenance.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            Property #{item.propertyId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(item.priority)}`}>
                              {item.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.scheduledDate.toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button className="text-blue-600 hover:text-blue-800">
                                <Edit className="w-4 h-4" />
                              </button>
                              <button className="text-green-600 hover:text-green-800">
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue</h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatCurrency(properties.reduce((sum, p) => sum + p.monthlyRevenue, 0))}
                  </div>
                  <div className="text-sm text-gray-600">From all properties</div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Rate</h3>
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {Math.round((properties.reduce((sum, p) => sum + p.occupancyRate, 0) / properties.length))}%
                  </div>
                  <div className="text-sm text-gray-600">Average across properties</div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Maintenance Costs</h3>
                  <div className="text-3xl font-bold text-red-600 mb-2">
                    {formatCurrency(maintenance.reduce((sum, m) => sum + (m.estimatedCost || 0), 0))}
                  </div>
                  <div className="text-sm text-gray-600">This month</div>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Report</h3>
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Revenue chart would go here</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Occupancy Trends</h3>
                  <div className="h-48 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <PieChart className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">Occupancy chart would go here</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Tenant Modal */}
      {showAddTenant && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Add New Tenant</h2>
                <button
                  onClick={() => setShowAddTenant(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tenant Name *
                  </label>
                  <input
                    type="text"
                    value={tenantForm.name}
                    onChange={(e) => setTenantForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    placeholder="Full name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={tenantForm.email}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={tenantForm.phone}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property
                  </label>
                  <select
                    value={tenantForm.propertyId}
                    onChange={(e) => setTenantForm(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Monthly Rent (₦)
                    </label>
                    <input
                      type="number"
                      value={tenantForm.monthlyRent}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, monthlyRent: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Security Deposit (₦)
                    </label>
                    <input
                      type="number"
                      value={tenantForm.securityDeposit}
                      onChange={(e) => setTenantForm(prev => ({ ...prev, securityDeposit: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    rows={3}
                    value={tenantForm.notes}
                    onChange={(e) => setTenantForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    placeholder="Additional notes..."
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleAddTenant}
                  className="flex-1 bg-[#FF6B35] text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Add Tenant
                </button>
                <button
                  onClick={() => setShowAddTenant(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Schedule Maintenance Modal */}
      {showScheduleMaintenance && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-lg shadow-xl max-w-md w-full"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">Schedule Maintenance</h2>
                <button
                  onClick={() => setShowScheduleMaintenance(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Property
                  </label>
                  <select
                    value={maintenanceForm.propertyId}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, propertyId: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="">Select Property</option>
                    {properties.map((property) => (
                      <option key={property.id} value={property.id}>
                        {property.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maintenance Type
                  </label>
                  <select
                    value={maintenanceForm.type}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, type: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="repair">Repair</option>
                    <option value="inspection">Inspection</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="painting">Painting</option>
                    <option value="plumbing">Plumbing</option>
                    <option value="electrical">Electrical</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Priority
                  </label>
                  <select
                    value={maintenanceForm.priority}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, priority: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                    <option value="emergency">Emergency</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    value={maintenanceForm.description}
                    onChange={(e) => setMaintenanceForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    placeholder="Describe the maintenance issue..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Estimated Cost (₦)
                    </label>
                    <input
                      type="number"
                      value={maintenanceForm.estimatedCost}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, estimatedCost: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scheduled Date
                    </label>
                    <input
                      type="date"
                      value={maintenanceForm.scheduledDate}
                      onChange={(e) => setMaintenanceForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={handleScheduleMaintenance}
                  className="flex-1 bg-[#FF6B35] text-white py-3 px-6 rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Schedule Maintenance
                </button>
                <button
                  onClick={() => setShowScheduleMaintenance(false)}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AdvancedPropertyManagement;
