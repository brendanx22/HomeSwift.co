import { supabase } from '../lib/supabaseClient.js';

export const getProperties = async (req, res) => {
  const { data, error } = await supabase.from('properties').select('*').order('created_at', { ascending: false });
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
};

export const getPropertyById = async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase.from('properties').select('*').eq('id', id).single();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
};

export const createProperty = async (req, res) => {
  const { title, description, price, location, landlord_id } = req.body;
  const payload = { title, description, price, location, landlord_id };
  const { data, error } = await supabase.from('properties').insert([payload]).select();
  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
};
