const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const tenant = require('../middleware/tenant');
const Setting = require('../models/Setting');

// @route   GET api/settings
// @desc    Get all settings (filtered by public or admin)
// @access  Private
router.get('/', auth, tenant, async (req, res) => {
  try {
    // If user is admin, get all settings, otherwise only public settings
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';
    const isSuperAdmin = req.user.role === 'superadmin';
    
    // Base filter - public vs all settings based on role
    let filter = isAdmin ? {} : { isPublic: true };
    
    // Add gym filter for non-superadmins
    if (!isSuperAdmin) {
      filter.gym = req.gymId;
    }
    
    const settings = await Setting.find(filter).sort({ category: 1 });
    
    // Group settings by category
    const groupedSettings = settings.reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      acc[setting.category].push(setting);
      return acc;
    }, {});
    
    res.json(groupedSettings);
  } catch (err) {
    console.error('Error fetching settings:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/settings/:key
// @desc    Get a specific setting by key
// @access  Private
router.get('/:key', auth, tenant, async (req, res) => {
  try {
    const setting = await Setting.findOne({ key: req.params.key });
    
    if (!setting) {
      return res.status(404).json({ msg: 'Setting not found' });
    }
    
    // Check if user has access to this setting
    const isAdmin = req.user.role === 'admin' || req.user.role === 'manager';
    if (!isAdmin && !setting.isPublic) {
      return res.status(403).json({ msg: 'Not authorized to access this setting' });
    }
    
    res.json(setting);
  } catch (err) {
    console.error('Error fetching setting:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/settings
// @desc    Create a new setting
// @access  Admin only
router.post('/', auth, tenant, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to create settings' });
  }
  
  const { key, value, category, label, description, type, isPublic } = req.body;
  
  try {
    // Check if setting already exists for this gym
    const query = { key };
    
    // Add gym filter for non-superadmins
    if (req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    let setting = await Setting.findOne(query);
    
    if (setting) {
      return res.status(400).json({ msg: 'Setting with this key already exists' });
    }
    
    // Create new setting
    setting = new Setting({
      key,
      value,
      category,
      label,
      description,
      type,
      isPublic,
      gym: req.gymId // Associate with gym
    });
    
    await setting.save();
    
    res.json(setting);
  } catch (err) {
    console.error('Error creating setting:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/settings/:key
// @desc    Update a setting
// @access  Admin only
router.put('/:key', auth, tenant, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to update settings' });
  }
  
  const { value, category, label, description, type, isPublic } = req.body;
  
  // Build setting object
  const settingFields = {};
  if (value !== undefined) settingFields.value = value;
  if (category) settingFields.category = category;
  if (label) settingFields.label = label;
  if (description !== undefined) settingFields.description = description;
  if (type) settingFields.type = type;
  if (isPublic !== undefined) settingFields.isPublic = isPublic;
  settingFields.updatedAt = Date.now();
  
  try {
    // Build query with key and gym ID (unless superadmin)
    const query = { key: req.params.key };
    
    // Add gym filter for non-superadmins
    if (req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    let setting = await Setting.findOne(query);
    
    if (!setting) {
      return res.status(404).json({ msg: 'Setting not found' });
    }
    
    // Update setting
    setting = await Setting.findOneAndUpdate(
      query,
      { $set: settingFields },
      { new: true }
    );
    
    res.json(setting);
  } catch (err) {
    console.error('Error updating setting:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE api/settings/:key
// @desc    Delete a setting
// @access  Admin only
router.delete('/:key', auth, tenant, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to delete settings' });
  }
  
  try {
    // Build query with key and gym ID (unless superadmin)
    const query = { key: req.params.key };
    
    // Add gym filter for non-superadmins
    if (req.user.role !== 'superadmin') {
      query.gym = req.gymId;
    }
    
    const setting = await Setting.findOne(query);
    
    if (!setting) {
      return res.status(404).json({ msg: 'Setting not found' });
    }
    
    await Setting.findOneAndRemove(query);
    
    res.json({ msg: 'Setting removed' });
  } catch (err) {
    console.error('Error deleting setting:', err.message);
    res.status(500).send('Server Error');
  }
});

// @route   POST api/settings/initialize
// @desc    Initialize default settings
// @access  Admin only
router.post('/initialize', auth, tenant, async (req, res) => {
  // Check if user is admin
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ msg: 'Not authorized to initialize settings' });
  }
  
  try {
    // Default settings
    const defaultSettings = [
      {
        key: 'gym_name',
        value: 'Fitness Center',
        category: 'general',
        label: 'Gym Name',
        description: 'The name of your gym',
        type: 'string',
        isPublic: true
      },
      {
        key: 'gym_address',
        value: '123 Fitness Street, Workout City',
        category: 'general',
        label: 'Gym Address',
        description: 'The address of your gym',
        type: 'string',
        isPublic: true
      },
      {
        key: 'gym_phone',
        value: '(555) 123-4567',
        category: 'general',
        label: 'Gym Phone',
        description: 'Contact phone number',
        type: 'string',
        isPublic: true
      },
      {
        key: 'gym_email',
        value: 'info@fitnesscenter.com',
        category: 'general',
        label: 'Gym Email',
        description: 'Contact email address',
        type: 'string',
        isPublic: true
      },
      {
        key: 'business_hours',
        value: {
          monday: { open: '06:00', close: '22:00' },
          tuesday: { open: '06:00', close: '22:00' },
          wednesday: { open: '06:00', close: '22:00' },
          thursday: { open: '06:00', close: '22:00' },
          friday: { open: '06:00', close: '22:00' },
          saturday: { open: '08:00', close: '20:00' },
          sunday: { open: '08:00', close: '18:00' }
        },
        category: 'general',
        label: 'Business Hours',
        description: 'Gym operating hours',
        type: 'object',
        isPublic: true
      },
      {
        key: 'enable_email_notifications',
        value: true,
        category: 'notifications',
        label: 'Enable Email Notifications',
        description: 'Send email notifications to members',
        type: 'boolean',
        isPublic: false
      },
      {
        key: 'enable_sms_notifications',
        value: false,
        category: 'notifications',
        label: 'Enable SMS Notifications',
        description: 'Send SMS notifications to members',
        type: 'boolean',
        isPublic: false
      },
      {
        key: 'currency',
        value: 'USD',
        category: 'billing',
        label: 'Currency',
        description: 'Default currency for payments',
        type: 'string',
        isPublic: true
      },
      {
        key: 'tax_rate',
        value: 8.5,
        category: 'billing',
        label: 'Tax Rate (%)',
        description: 'Default tax rate for invoices',
        type: 'number',
        isPublic: false
      },
      {
        key: 'primaryColor',
        value: '#1976d2',
        category: 'appearance',
        label: 'Primary Color',
        description: 'Primary color for the application theme',
        type: 'string',
        isPublic: true
      },
      {
        key: 'secondaryColor',
        value: '#dc004e',
        category: 'appearance',
        label: 'Secondary Color',
        description: 'Secondary color for the application theme',
        type: 'string',
        isPublic: true
      },
      {
        key: 'darkMode',
        value: false,
        category: 'appearance',
        label: 'Dark Mode',
        description: 'Enable dark mode for the application',
        type: 'boolean',
        isPublic: true
      },
      {
        key: 'logo_url',
        value: 'https://via.placeholder.com/200x50?text=Gym+CRM',
        category: 'appearance',
        label: 'Logo URL',
        description: 'URL to the gym logo image',
        type: 'string',
        isPublic: true
      },
      {
        key: 'system_version',
        value: '1.0.0',
        category: 'system',
        label: 'System Version',
        description: 'Current version of the Gym CRM system',
        type: 'string',
        isPublic: true
      }
    ];
    
    // Insert default settings if they don't exist for this gym
    for (const setting of defaultSettings) {
      // Build query with key and gym ID
      const query = { key: setting.key };
      
      // Add gym filter for non-superadmins
      if (req.user.role !== 'superadmin') {
        query.gym = req.gymId;
      }
      
      const existingSetting = await Setting.findOne(query);
      
      if (!existingSetting) {
        // Add gym ID to the setting
        const newSetting = {
          ...setting,
          gym: req.gymId
        };
        
        await new Setting(newSetting).save();
      }
    }
    
    res.json({ msg: 'Default settings initialized' });
  } catch (err) {
    console.error('Error initializing settings:', err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
