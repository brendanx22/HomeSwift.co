import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Phone,
  Mail,
  Video,
  Camera,
  CheckCircle,
  X,
  Calendar as CalendarIcon,
  Users,
  Home,
  MessageSquare,
  Star,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'react-hot-toast';
import { format, addDays, isBefore, startOfDay } from 'date-fns';

const PropertyScheduling = ({ propertyId, propertyTitle, landlordId }) => {
  const { user, isAuthenticated } = useAuth();
  const [scheduling, setScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [tourType, setTourType] = useState('in-person');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Available time slots
  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  // Tour types
  const tourTypes = [
    {
      id: 'in-person',
      label: 'In-Person Tour',
      description: 'Visit the property in person',
      icon: Home,
      duration: '30-45 minutes'
    },
    {
      id: 'virtual',
      label: 'Virtual Tour',
      description: 'Live video call tour',
      icon: Video,
      duration: '20-30 minutes'
    },
    {
      id: 'video',
      label: 'Recorded Video Tour',
      description: 'Pre-recorded property tour',
      icon: Camera,
      duration: '10-15 minutes'
    }
  ];

  const handleScheduleTour = async () => {
    if (!selectedDate || !selectedTime || !tourType) {
      toast.error('Please select date, time, and tour type');
      return;
    }

    if (isBefore(new Date(`${selectedDate} ${selectedTime}`), new Date())) {
      toast.error('Please select a future date and time');
      return;
    }

    try {
      setLoading(true);

      // In a real implementation, this would save to a bookings/tours table
      const bookingData = {
        property_id: propertyId,
        renter_id: user.id,
        landlord_id: landlordId,
        tour_type: tourType,
        scheduled_date: `${selectedDate} ${selectedTime}`,
        notes: notes,
        status: 'pending',
        created_at: new Date().toISOString()
      };

      // Mock API call
      console.log('Booking tour:', bookingData);

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      toast.success('Tour scheduled successfully! You will receive a confirmation email.');
      setScheduling(false);

      // Reset form
      setSelectedDate('');
      setSelectedTime('');
      setTourType('in-person');
      setNotes('');

    } catch (error) {
      console.error('Error scheduling tour:', error);
      toast.error('Failed to schedule tour');
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableDates = () => {
    const dates = [];
    for (let i = 0; i < 30; i++) {
      const date = addDays(new Date(), i);
      if (!isBefore(startOfDay(date), startOfDay(new Date()))) {
        dates.push(date);
      }
    }
    return dates;
  };

  if (!isAuthenticated) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Login Required</h3>
        <p className="text-gray-600">Please log in to schedule property tours</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Schedule a Property Tour</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tour Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Tour Type
            </label>
            <div className="space-y-3">
              {tourTypes.map((type) => (
                <label
                  key={type.id}
                  className={`flex items-start space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                    tourType === type.id
                      ? 'border-[#FF6B35] bg-orange-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="tourType"
                    value={type.id}
                    checked={tourType === type.id}
                    onChange={(e) => setTourType(e.target.value)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <type.icon className="w-5 h-5 text-gray-600" />
                      <span className="font-medium text-gray-900">{type.label}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{type.description}</p>
                    <p className="text-xs text-gray-500">Duration: {type.duration}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Date & Time Selection */}
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={format(new Date(), 'yyyy-MM-dd')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Time
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
              >
                <option value="">Choose a time</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes (Optional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any specific questions or requirements for the tour..."
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#FF6B35] focus:border-transparent"
          />
        </div>

        {/* Schedule Button */}
        <div className="mt-6 flex space-x-3">
          <button
            onClick={handleScheduleTour}
            disabled={loading}
            className="flex-1 bg-[#FF6B35] text-white py-3 px-6 rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent inline-block mr-2"></div>
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4 inline-block mr-2" />
                Schedule Tour
              </>
            )}
          </button>
          <button
            onClick={() => setScheduling(false)}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Tour Guidelines */}
      <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-3">Tour Guidelines</h4>
        <div className="space-y-2 text-sm text-blue-800">
          <p>• Please arrive on time for in-person tours</p>
          <p>• Virtual tours require a stable internet connection</p>
          <p>• Bring valid ID for in-person property viewings</p>
          <p>• Tours are typically 30-45 minutes for in-person visits</p>
          <p>• You can reschedule up to 2 hours before the scheduled time</p>
        </div>
      </div>

      {/* Upcoming Tours */}
      <div className="bg-white rounded-lg p-6 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-4">Your Upcoming Tours</h4>

        {/* Mock upcoming tours - in real implementation, this would query bookings table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">Virtual Tour Scheduled</p>
                <p className="text-sm text-gray-600">Tomorrow at 2:00 PM</p>
              </div>
            </div>
            <button className="text-green-600 hover:text-green-800 transition-colors">
              Join Call
            </button>
          </div>

          <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">In-Person Tour Pending</p>
                <p className="text-sm text-gray-600">Friday at 10:00 AM</p>
              </div>
            </div>
            <button className="text-yellow-600 hover:text-yellow-800 transition-colors">
              Reschedule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyScheduling;
